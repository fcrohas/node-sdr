<template>
  <v-container fluid>
    <v-layout>
      <v-flex xs12 align-end flexbox>
        <v-progress-circular
            v-bind:size="100"
            v-bind:width="15"
            v-bind:rotate="360"
            v-bind:value="getAvailableBufferSize"
            class="teal--text"
          >
            {{ getAvailableBufferSize }} %
        </v-progress-circular>
      </v-flex>
      <v-flex xs12 align-end flexbox>
        <span>Buffer status : {{getBufferStatus}}</span>
      </v-flex>
      <v-flex xs12 align-end flexbox>
        <canvas ref="audioSpectrum" class="audioSpectrum"></canvas>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import Websocket from '../../service/websocket'
import opus from 'libopus.js'

export default {
  name: 'AudioStream',

  data () {
    return {
      playBufferSize: 24000 * 1,
      sourceSampleRate: 24000,
      context: null,
      gainNode: null,
      ringbuffer: null,
      ringwriteoffset: 0,
      ringreadoffset: 0,
      ringavailable: 0,
      isPlaying: false,
      time: 0,
      fftArray: null,
      analyzer: null,
      width: 640,
      height: 480,
      sources: []
    }
  },
  computed: {
    ...mapGetters({
      isConnected: 'isConnected'
    }),
    getAvailableBufferSize () {
      if ((this.ringavailable != null) && (this.ringbuffer != null)) {
        return Math.round(this.ringavailable * 100 / this.ringbuffer.length)
      } else {
        return 0
      }
    },
    getBufferStatus () {
      if (this.ringavailable < this.playBufferSize) {
        return 'Underrun'
      } else {
        return ''
      }
    }
  },
  methods: {
    createPlayBuffer (chunk) {
      // create a 1s audio buffer
      const audioBuffer = this.context.createBuffer(1, this.playBufferSize, this.sourceSampleRate)
      // Get data from channel
      const buffer = audioBuffer.getChannelData(0)
      buffer.set(chunk)
      // Play buffer source
      const source = this.context.createBufferSource()
      // Assign new buffer
      source.buffer = audioBuffer
      // Connect Web Audio component
      // Analyzer
      source.connect(this.analyzer)
      // Gain
      this.analyzer.connect(this.gainNode)
      // this.filler.connect(this.gainNode)
      this.gainNode.connect(this.context.destination)
      // Return current buffer time
      return source
    },
    getPlayDirectBuffer () {
      const output = new Float32Array(this.playBufferSize)
      if (this.ringreadoffset + this.playBufferSize > this.ringbuffer.length) {
        output.set(this.ringbuffer.subarray(this.ringreadoffset, this.ringbuffer.length - this.ringreadoffset))
        output.set(this.ringbuffer.subarray(0, this.playBufferSize - this.ringbuffer.length - this.ringreadoffset), this.ringbuffer.length - this.ringreadoffset)
        this.ringreadoffset = this.playBufferSize - (this.ringbuffer.length - this.ringreadoffset)
      } else {
        output.set(this.ringbuffer.subarray(this.ringreadoffset, this.ringreadoffset + this.playBufferSize))
        this.ringreadoffset += this.playBufferSize
      }
      // retrieve 16384
      this.ringavailable -= this.playBufferSize
      // Play buffer
      return this.createPlayBuffer(output)
    },
    draw (canvasCtx) {
      this.analyzer.getByteFrequencyData(this.fftArray)
      const minimum = this.analyzer.minDecibels
      const maximum = this.analyzer.maxDecibels
      const scale = this.height / (maximum - minimum)
      canvasCtx.fillStyle = 'rgb(0, 0, 0)'
      canvasCtx.fillRect(0, 0, this.width, this.height)
      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(255, 255, 255)'
      canvasCtx.beginPath()
      let sliceWidth = this.width * 1.0 / this.analyzer.frequencyBinCount
      let x = 0
      for (let i = 0; i < this.analyzer.frequencyBinCount; i++) {
        let v = this.fftArray[i] / 2 * scale
        canvasCtx.fillStyle = 'rgb(' + (v + 100) + ', 50, 50)'
        canvasCtx.fillRect(x, this.height - v / 2, sliceWidth, v)
        x += sliceWidth + 1
      }
      canvasCtx.lineTo(this.width, this.height / 2)
      canvasCtx.stroke()
      requestAnimationFrame(() => { this.draw(canvasCtx) })
    }
  },
  watch: {
    isConnected (value) {
      if (!value) {
        Websocket.offEvent('pcm')
        return
      }
      // Prepare Opus decompress
      const decoder = new opus.Decoder({rate: this.sourceSampleRate, channels: 1})
      // wait for websocket pcm data
      Websocket.onEvent('pcm', (data) => {
        // Decode frames
        const pcm = decoder.decodeFloat32(Buffer.from(data))
        // if ring buffer is full soon
        if (this.ringwriteoffset + pcm.length > this.ringbuffer.length) {
          // fill end with remaining data
          this.ringbuffer.set(pcm.subarray(0, this.ringbuffer.length - this.ringwriteoffset), this.ringwriteoffset)
          // then fill remaining to buffer start
          this.ringwriteoffset = pcm.length - (this.ringbuffer.length - this.ringwriteoffset)
          this.ringbuffer.set(pcm.subarray(this.ringwriteoffset))
        } else {
          // add to ring buffer end
          this.ringbuffer.set(pcm, this.ringwriteoffset)
          this.ringwriteoffset += pcm.length
        }
        this.ringavailable += pcm.length
        // start playing when engouh available
        if (this.ringavailable >= this.playBufferSize) {
          if (!this.isPlaying) {
            // Wait 5s before launch playing
            if (this.ringavailable >= this.playBufferSize * 5) {
              const canvasCtx = this.$refs.audioSpectrum.getContext('2d')
              this.$refs.audioSpectrum.width = this.width
              this.$refs.audioSpectrum.height = this.height
              this.draw(canvasCtx)
              for (let i = 0; i < 2; i++) {
                const source = this.getPlayDirectBuffer()
                if (i === 0) {
                  this.time = this.context.currentTime
                  source.start(this.time)
                  this.time += source.buffer.duration
                } else {
                  source.start(this.time)
                  this.time += source.buffer.duration
                }
              }
              this.isPlaying = true
            }
          } else {
            const source = this.getPlayDirectBuffer()
            source.start(this.time)
            this.time += source.buffer.duration
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
    // 15s audio buffer
    this.ringbuffer = new Float32Array(this.sourceSampleRate * 10)
    // create a gain node
    this.gainNode = this.context.createGain()
    this.gainNode.gain.value = 2
    // create analyzer visualization
    this.analyzer = this.context.createAnalyser()
    this.analyzer.fftSize = 2048
    this.fftArray = new Uint8Array(this.analyzer.frequencyBinCount)
  },
  destroyed: function () {
    this.context.close()
    this.isPlaying = false
  }
}
</script>

<style lang="css" scoped>
.audioSpectrum {
  position: absolute;
  border:1px solid #BBB;
  width: 100%;
  height: 100%;
}
</style>