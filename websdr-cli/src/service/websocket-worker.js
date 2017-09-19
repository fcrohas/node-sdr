import websocket from './websocket'
import Adpcm from './codecs/adpcm'
import opus from 'libopus.js'

let ringbuffer = new Float32Array(24000 * 5)
let ringwriteoffset = 0
let ringreadoffset = 0
let ringavailable = 0
let isPlaying = false
let playBufferSize = 24000

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
          websocket.emit(data.params.emit, data.params.message, (message) => {
            postMessage({cmd: 'emit', name: data.params.emit, ack : data.params.ack, message: message})
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
      case 'offAudioFrame':
        websocket.offEvent('pcm');
        isPlaying = false
        break;
      case 'onAudioFrame':
        // Prepare Opus decompress
        ringbuffer = new Float32Array(data.params.sampleRate * 4)
        ringwriteoffset = 0
        ringreadoffset = 0
        ringavailable = 0
        isPlaying = false
        playBufferSize = data.params.sampleRate

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
            const remaining = pcm.length - (ringbuffer.length - ringwriteoffset)
            ringbuffer.set(pcm.subarray(ringbuffer.length - ringwriteoffset), 0)
            ringwriteoffset = remaining
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
            postMessage({cmd: 'onAudioFrame', name: 'onAudioFrame', ack: callback, message: getPlayDirectBuffer()})
          }
        })      
        break;
      case 'onFFTFrame':
        const adpcm = new Adpcm()
        // compressed data are received int int16array so half the size of uint8array
        const localCallback = data.params.callback
        const size = data.params.bins
        websocket.onEvent('fft', (data) => {
            // get compressed data
            const compressedData = new Uint8Array(Buffer.from(data))
            // x4 for real array size
            const decodedData = new Int16Array(compressedData.length * 2)            
            // do decompress
            const state = { predicted_value:0 , step_index:0 }            
            adpcm.adpcm_ima_decode(decodedData, compressedData, compressedData.length, state)
            const decompress = new Uint8Array(decodedData.buffer);
            //console.log('compressed array length=',compressedData.length, 'int16array length=', decodedData.length,'decompress length=',decompress.length);
            // notify 
            postMessage({cmd: 'onFFTFrame', name: 'onFFTFrame', ack: localCallback, message: decompress})
        })
        break;
    }
})