import websocket from './websocket'
import Adpcm from './codecs/adpcm'
import opus from 'libopus.js'

let ringbuffer = new Float32Array(16000 * 40)
let ringwriteoffset = 0
let ringreadoffset = 0
let ringavailable = 0
let isPlaying = false
let playBufferSize = 16000
let startRead = false

function getPlayDirectBuffer () {
  const output = new Float32Array(playBufferSize)
  if (ringreadoffset + playBufferSize >= ringbuffer.length) {
    let remainToTheEnd = ringbuffer.length - ringreadoffset
    // read to the end
    output.set(ringbuffer.subarray(ringreadoffset))
    // Read remaining from start of buffer play buffer size minus already read octets
    ringreadoffset = playBufferSize - remainToTheEnd 
    output.set(ringbuffer.subarray(0, ringreadoffset), remainToTheEnd)
  } else {
    output.set(ringbuffer.subarray(ringreadoffset, ringreadoffset + playBufferSize))
    ringreadoffset += playBufferSize
    // SHOULD NOT HAPPEN
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
        ringbuffer = new Float32Array(data.params.sampleRate * 40)
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
          if (ringwriteoffset + pcm.length >= ringbuffer.length) {
            // fill end with remaining data
            let remainToTheEnd = ringbuffer.length - ringwriteoffset
            ringbuffer.set(pcm.subarray(0, remainToTheEnd), ringwriteoffset)
            // then fill remaining to buffer start
            ringbuffer.set(pcm.subarray(remainToTheEnd), 0)
            ringwriteoffset = pcm.length - remainToTheEnd
          } else {
            // add to ring buffer end
            ringbuffer.set(pcm, ringwriteoffset)
            ringwriteoffset += pcm.length
            // SHOULD NOT HAPPEN
            if (ringwriteoffset >= ringbuffer.length) {
                ringwriteoffset -= ringbuffer.length
            }
          }
          ringavailable += pcm.length
          // send when when engouth data available
          if ((ringavailable >= playBufferSize * 8) && (!startRead)) {
            // console.log('Initial ringavailable at ', ringavailable,' ringreadoffset at ' , ringreadoffset, ' ringwriteoffset', ringwriteoffset)
            postMessage({cmd: 'onAudioFrame', name: 'onAudioFrame', ack: callback, message: getPlayDirectBuffer()})
            startRead = true
          } else {
            if ((ringavailable >= playBufferSize) && (startRead)) {
              // console.log('ringavailable at ', ringavailable,' ringreadoffset at ' , ringreadoffset, ' ringwriteoffset', ringwriteoffset)
              postMessage({cmd: 'onAudioFrame', name: 'onAudioFrame', ack: callback, message: getPlayDirectBuffer()})
              ringavailable = 0
            }
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
            const compressedData = new Uint8Array(data)
            // x4 for real array size
            const decompress = new Uint8Array(compressedData.length * 2)            
            // do decompress
            const state = { predicted_value:0 , step_index:0 }            
            adpcm.adpcm_ima_decode(decompress, compressedData, compressedData.length, state)
            // notify 
            postMessage({cmd: 'onFFTFrame', name: 'onFFTFrame', ack: localCallback, message: decompress})
        })
        break;
    }
})
