<template>
  <v-container fluid class="container">
    <v-layout class="full-size">
      <v-flex xs12 align-end flexbox class="full-size">
        <div ref="parent" class="full-size">
          <canvas ref="audioSpectrum" class="audioSpectrum"></canvas>
          <v-progress-circular
              v-bind:size="80"
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
    <v-layout class="full-size" row wrap>
      <v-flex xs12 flexbox class="full-size">
          <vue-slider v-model="volume" :min="0.1" :max="2" :interval="0.1" :width="200" :tooltip="'hover'" tooltip-dir="'right'" @callback="volumeChanged"></vue-slider>      
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import vueSlider from 'vue-slider-component'
import { mapGetters } from 'vuex'
import Websocket from '../../service/websocket-cli'

export default {
  name: 'AudioStream',
  components: { vueSlider },
  data () {
    return {
      playBufferSize: 16000,
      sourceSampleRate: 16000,
      context: null,
      gainNode: null,
      isPlaying: false,
      time: 0,
      fftArray: null,
      analyzer: null,
      width: 320,
      height: 255,
      pcmData: [],
      volume: 1
    }
  },
  computed: {
    ...mapGetters({
      isConnected: 'isConnected',
      audiorate: 'audiorate'
    }),
    getAvailableBufferSize () {
      if (this.context) {
        return Math.round(this.time - this.context.currentTime)
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
      source.onended = () => {
        if (this.pcmData.length > 0) {
          const nextSource = this.createPlayBuffer(this.pcmData.shift())
          nextSource.start(this.time)
          this.time += nextSource.buffer.duration
          console.log('Previous buffer read prepare futur buffer ', this.time)
        } else {
          if (this.context.currentTime >= this.time - 0.8) {
            this.isPlaying = false
            console.log('Stop playing')
          }
          console.log('No more data to play current time=', this.context.currentTime, ' time=', this.time)
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
    },
    volumeChanged (value) {
      if (this.gainNode != null) {
        this.gainNode.gain.value = value
      }
    }
  },
  watch: {
    audiorate (value) {
      console.log('Audio rate change to ' + value)
      // audio rate change
      this.sourceSampleRate = value
      this.playBufferSize = value
      // disconnect previous
      Websocket.offAudioFrame()
      // wait for websocket pcm data
      this.isConnected(false)
    },
    isConnected (value) {
      if (!value) {
        return
      }
      // const canvasCtx = this.$refs.audioSpectrum.getContext('2d')
      // this.draw(canvasCtx)
      // wait for websocket pcm data
      Websocket.onAudioFrame(this.sourceSampleRate, 1, (pcm) => {
        // Add decoded pcm to list
        this.pcmData.push(pcm)
        // 8 s buffering
        if ((this.pcmData.length > 4) && (!this.isPlaying)) {
          const source = this.createPlayBuffer(this.pcmData.shift())
          // Start playing in 5s
          this.time = this.context.currentTime + 1
          source.start(this.time)
          // Next buffer should be at buffer duration +
          this.time += source.buffer.duration
          console.log('Initial time + buffer ', this.time)
          let i = 0
          while (i < 3) {
            // Add it
            const source = this.createPlayBuffer(this.pcmData.shift())
            source.start(this.time)
            this.time += source.buffer.duration
            console.log('Next buffer ', this.time)
            i++
          }
          this.isPlaying = true
        }
      })
    }
  },
  mounted: function () {
    if (this.$route.params != null) {
      this.$nextTick(() => {
        this.serialNumber = this.$route.params.serialNumber
        window.addEventListener('resize', () => {
          this.$refs.audioSpectrum.style.width = this.$refs.parent.clientWidth + 'px'
          this.$refs.audioSpectrum.style.height = this.$refs.parent.clientHeight + 'px'
        })
        // Setup canvas audio analyzer
        const canvasCtx = this.$refs.audioSpectrum.getContext('2d')
        this.width = this.$refs.parent.clientWidth
        this.height = this.$refs.parent.clientHeight
        this.$refs.audioSpectrum.width = this.width
        this.$refs.audioSpectrum.height = this.height
        this.$refs.audioSpectrum.style.width = this.$refs.parent.clientWidth + 'px'
        this.$refs.audioSpectrum.style.height = this.$refs.parent.clientHeight + 'px'
        // Prepare webaudio API
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        // Audio context
        this.context = new window.AudioContext()
        // create a gain node
        this.gainNode = this.context.createGain()
        this.gainNode.gain.value = this.volume
        // create analyzer visualization
        this.analyzer = this.context.createAnalyser()
        this.analyzer.fftSize = 128
        this.fftArray = new Uint8Array(this.analyzer.frequencyBinCount)
        this.draw(canvasCtx)
      })
    }
  },
  destroyed: function () {
    this.context.close()
    this.isPlaying = false
  }
}
</script>

<style lang="css" scoped>
.container {
  width:100%;
  height:300px;
}
.full-size {
  width: 100%;
  height: 100%;
/*  padding: 0px;*/
}
.audioSpectrum {
  position: absolute;
  border:1px solid #BBB;
/*  width: 100%;
  height: 100%;
*/  z-index: 0;
}
.buffer {
  position: absolute;
  top: 110px;
  right: 60px;
  z-index: 1;
}
</style>
