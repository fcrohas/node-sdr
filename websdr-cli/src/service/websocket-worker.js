import websocket from './websocket'
import opus from 'libopus.js'

const ringbuffer = new Float32Array(24000 * 20)
let ringwriteoffset = 0
let ringreadoffset = 0
let ringavailable = 0
let isPlaying = false
const playBufferSize = 24000

function getPlayDirectBuffer () {
  const output = new Float32Array(playBufferSize)
  if (ringreadoffset + playBufferSize > ringbuffer.length) {
    output.set(ringbuffer.subarray(ringreadoffset, ringbuffer.length - ringreadoffset))
    output.set(ringbuffer.subarray(0, playBufferSize - ringbuffer.length - ringreadoffset), ringbuffer.length - ringreadoffset)
    ringreadoffset = playBufferSize - (ringbuffer.length - ringreadoffset)
  } else {
    output.set(ringbuffer.subarray(ringreadoffset, ringreadoffset + playBufferSize))
    ringreadoffset += playBufferSize
    if (ringreadoffset >= ringbuffer.length) {
        ringreadoffset -= ringbuffer.length
    }
  }
  // retrieve 16384
  ringavailable -= playBufferSize
  // Play buffer
  return output
}


addEventListener('message', (event) => {
    const data = event.data
    switch(data.cmd) {
      case 'connect':
        websocket.connect(data.params.serialNumber)
        break;
      case 'disconnect':
        websocket.close('disconnect')
        break;
      case 'emit':
        if (data.params.ack != null) {
          websocket.emit(data.params.emit, data.params.message, () => {
            postMessage({cmd: 'emit', name: data.params.emit, ack : data.params.ack})
          })
        } else {
            websocket.emit(data.params.emit, data.params.message)
        }
        break;
      case 'send':
        if (data.params.ack != null) {
          websocket.send(data.params.message, () => {
            postMessage({cmd: 'send', ack : data.params.ack})
          })
        } else {
          websocket.send(data.params.message)
        }
        break;
      case 'on':
        websocket.onEvent(data.params.on, (message) => {
          postMessage({cmd: 'on', name: data.params.on, ack: data.params.callback, message: message})
        })
        break;
      case 'off':
        websocket.offEvent(data.params.off)
        break;
      case 'once':
        websocket.onceEvent(data.params.once, (message) => {
          postMessage({cmd: 'once', name: data.params.once, message: message, ack : data.params.callback})
        })
        break;
      case 'audioFrame':
        // Prepare Opus decompress
        const decoder = new opus.Decoder({rate: data.params.sampleRate, channels: data.params.channels, unsafe: true})
        const callback = data.params.callback
        // wait for websocket pcm data
        websocket.onEvent('pcm', (data) => {
          // Decode frames
          const pcm = decoder.decodeFloat32(Buffer.from(data))
          // if ring buffer is full soon
          if (ringwriteoffset + pcm.length > ringbuffer.length) {
            // fill end with remaining data
            ringbuffer.set(pcm.subarray(0, ringbuffer.length - ringwriteoffset), ringwriteoffset)
            // then fill remaining to buffer start
            ringwriteoffset = pcm.length - (ringbuffer.length - ringwriteoffset)
            ringbuffer.set(pcm.subarray(ringwriteoffset, pcm.length - ringwriteoffset), 0)
          } else {
            // add to ring buffer end
            ringbuffer.set(pcm, ringwriteoffset)
            ringwriteoffset += pcm.length
            if (ringwriteoffset >= ringbuffer.length) {
                ringwriteoffset -= ringbuffer.length
            }
          }
          ringavailable += pcm.length
          // send when when engouth data available
          if (ringavailable >= playBufferSize) {
            postMessage({cmd: 'audioFrame', name: 'audioFrame', ack: callback, message: getPlayDirectBuffer()})
          }
        })      
        break;
    }
})