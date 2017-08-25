<template>
    <h2>Audio</h2>
</template>

<script>
import { mapGetters } from 'vuex'
import Websocket from '../../service/websocket'
import opus from 'libopus.js'

export default {
  name: 'AudioStream',

  data () {
    return {
      samplerate: 24000,
      context: null,
      source: null,
      gainNode: null,
      filler: null,
      buffer: null,
      ringbuffer: null,
      ringwriteoffset: 0,
      ringreadoffset: 0,
      ringavailable: 0,
      isPlaying: false
    }
  },
  computed: mapGetters({
    isConnected: 'isConnected'
  }),
  methods: {
    getRingBufferData: function (event) {
      // Buffer pointer
/*      const output = event.outputBuffer.getChannelData(0)
      if (this.ringreadoffset + 16384 > this.ringbuffer.length) {
        output.set(this.ringbuffer.subarray(this.ringreadoffset, this.ringbuffer.length - this.ringreadoffset))
        output.set(this.ringbuffer.subarray(0, 16384 - this.ringbuffer.length - this.ringreadoffset), this.ringbuffer.length - this.ringreadoffset)
      } else {
        output.set(this.ringbuffer.subarray(this.ringreadoffset, this.ringreadoffset + 16384))
      }
      // retrieve 16384
      this.ringavailable -= 16384 */
    },
    playBuffer: function () {
      // const buffer = this.buffer.getChannelData(0)
      // Play buffer source
      this.source.buffer = this.buffer
      // Connect Web Audio component
      this.source.connect(this.filler)
      this.filler.connect(this.gainNode)
      this.gainNode.connect(this.context.destination)
      this.source.loop = true
      this.source.start(0)
    },
    playDirectBuffer: function () {
      const output = this.buffer.getChannelData(0)
      if (this.ringreadoffset + 16384 > this.ringbuffer.length) {
        output.set(this.ringbuffer.subarray(this.ringreadoffset, this.ringbuffer.length - this.ringreadoffset))
        output.set(this.ringbuffer.subarray(0, 16384 - this.ringbuffer.length - this.ringreadoffset), this.ringbuffer.length - this.ringreadoffset)
        this.ringreadoffset = 16384 - this.ringbuffer.length - this.ringreadoffset
      } else {
        output.set(this.ringbuffer.subarray(this.ringreadoffset, this.ringreadoffset + 16384))
        this.ringreadoffset += 16384
      }
      // retrieve 16384
      this.ringavailable -= 16384
      // this.source.buffer = this.buffer
    }
  },
  watch: {
    isConnected (value) {
      if (!value) {
        Websocket.offEvent('pcm')
        return
      }
      // Prepare Opus decompress
      const decoder = new opus.Decoder({rate: this.samplerate, channels: 1})
      // wait for websocket pcm data
      Websocket.onEvent('pcm', (data) => {
        // Decode frames
        const pcm = decoder.decodeFloat32(Buffer.from(data))
        this.ringavailable += pcm.length
        // if ring buffer is full soon
        if (this.ringwriteoffset + pcm.length > this.ringbuffer.length) {
          // fill end with remaining data
          this.ringbuffer.set(pcm.subarray(0, this.ringbuffer.length - this.ringwriteoffset), this.ringwriteoffset)
          // then fill remaining to buffer start
          this.ringwriteoffset = this.ringbuffer.length - this.ringwriteoffset
          this.ringbuffer.set(pcm.subarray(this.ringwriteoffset))
        } else {
          // add to ring buffer end
          this.ringbuffer.set(pcm, this.ringwriteoffset)
          this.ringwriteoffset += pcm.length
        }
        // start playing when engouh available
        if (this.ringavailable > 16384) {
          if (!this.isPlaying) {
            this.playBuffer()
            this.isPlaying = true
            setInterval(this.playDirectBuffer, this.buffer.duration * 1000)
          }
        }
      })
    }
  },
  mounted: function () {
    // Prepare webaudio API
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    // Audio context
    this.context = new window.AudioContext()
    // create a source
    this.source = this.context.createBufferSource(0)
    // create a gain node
    this.gainNode = this.context.createGain()
    this.gainNode.gain.value = 25
    // create a 5s audio buffer
    this.buffer = this.context.createBuffer(1, 16384, this.samplerate)
    // Create a script processor to loop on
    this.filler = this.context.createScriptProcessor(16384, 1, 1)
    this.filler.onaudioprocess = this.getRingBufferData
    // 20s audio buffer
    this.ringbuffer = new Float32Array(this.samplerate * 20)
  }
}
</script>

<style lang="css" scoped>
</style>