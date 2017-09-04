<template>
  <v-container fluid class="full-size">
    <v-layout class="full-size">
      <v-flex xs12 align-end flexbox class="full-size">
        <div class="full-size">
          <canvas ref="audioSpectrum" class="audioSpectrum"></canvas>
          <v-progress-circular
              v-bind:size="70"
              v-bind:width="15"
              v-bind:rotate="360"
              v-bind:value="getAvailableBufferSize"
              class="teal--text buffer"
            >
              {{ getAvailableBufferSize }}
          </v-progress-circular>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import Websocket from '../../service/websocket-cli'

export default {
  name: 'AudioStream',

  data () {
    return {
      playBufferSize: 24000,
      sourceSampleRate: 24000,
      context: null,
      gainNode: null,
      isPlaying: false,
      time: 0,
      fftArray: null,
      analyzer: null,
      width: 320,
      height: 255,
      pcmData: []
    }
  },
  computed: {
    ...mapGetters({
      isConnected: 'isConnected'
    }),
    getAvailableBufferSize () {
      return this.pcmData.length * 100 / 10
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
      source.onended = () => {
        if (this.pcmData.length > 0) {
          const nextSource = this.createPlayBuffer(this.pcmData.shift())
          nextSource.start(this.time)
          this.time += nextSource.buffer.duration
        } else {
          this.isPlaying = false
        }
      }
      // Gain
      this.analyzer.connect(this.gainNode)
      this.gainNode.connect(this.context.destination)
      return source
    },
    draw (canvasCtx) {
      this.analyzer.getByteFrequencyData(this.fftArray)
      // Compute min / max
      const maxmin = new Uint8Array(this.fftArray)
      maxmin.sort()
      const minimum = maxmin[0]
      const maximum = maxmin[maxmin.length - 1]
      canvasCtx.fillStyle = 'rgb(0, 0, 0)'
      canvasCtx.fillRect(0, 0, this.width, this.height)
      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(255, 255, 255)'
      canvasCtx.beginPath()
      canvasCtx.fillStyle = 'rgb(255, 50, 50)'
      let sliceWidth = this.width * 1.0 / this.analyzer.frequencyBinCount
      let x = 0
      for (let i = 0; i < this.analyzer.frequencyBinCount; i++) {
        let v = (this.fftArray[i] - minimum) * 255 / (maximum - minimum)
        canvasCtx.fillRect(x, this.height - v, sliceWidth, v)
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
        return
      }
      // const canvasCtx = this.$refs.audioSpectrum.getContext('2d')
      this.$refs.audioSpectrum.width = this.width
      this.$refs.audioSpectrum.height = this.height
      // this.draw(canvasCtx)
      // wait for websocket pcm data
      Websocket.onAudioFrame(this.sourceSampleRate, 1, (pcm) => {
        // Add decoded pcm to list
        this.pcmData.push(pcm)
        // 8 s buffering
        if ((this.pcmData.length > 10) && (!this.isPlaying)) {
          const source = this.createPlayBuffer(this.pcmData.shift())
          this.time = this.context.currentTime + 1
          source.start(this.time)
          this.time += source.buffer.duration
          let i = 0
          while (i < 5) {
            const source = this.createPlayBuffer(this.pcmData.shift())
            source.start(this.time)
            this.time += source.buffer.duration
            i++
          }
          this.isPlaying = true
        }
      })
    }
  },
  mounted: function () {
    if (this.$route.params != null) {
      this.serialNumber = this.$route.params.serialNumber
      // Setup canvas audio analyzer
      const canvasCtx = this.$refs.audioSpectrum.getContext('2d')
      this.$refs.audioSpectrum.width = this.width
      this.$refs.audioSpectrum.height = this.height
      // Prepare webaudio API
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      // Audio context
      this.context = new window.AudioContext()
      // create a gain node
      this.gainNode = this.context.createGain()
      this.gainNode.gain.value = 2
      // create analyzer visualization
      this.analyzer = this.context.createAnalyser()
      this.analyzer.fftSize = 128
      this.fftArray = new Uint8Array(this.analyzer.frequencyBinCount)
      this.draw(canvasCtx)
    }
  },
  destroyed: function () {
    this.context.close()
    this.isPlaying = false
  }
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
  padding: 0px;
}
.audioSpectrum {
  position: absolute;
  border:1px solid #BBB;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.buffer {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
}
</style>