<template>
  <md-layout md-gutter>
    <md-layout></md-layout>
    <md-layout>
      <md-layout class="spacing" md-column>
        <canvas class="spectrum" v-draw-fft="fftdata"></canvas>
        <md-button @click="disconnect()" class="md-raised">Close</md-button>
      </md-layout>
    </md-layout>
    <md-layout></md-layout>
  </md-layout>
</template>

<script>
import Websocket from '../../service/websocket'
import Service from '../../service/api'

export default {
  name: 'waterfall',
  props: {
    sampleRate: {
      type: Number,
      default: 2048000
    },
    centerFrequency: {
      type: Number,
      default: 105000000
    }
  },
  data () {
    return {
      serialNumber: '',
      fftdata: {scale: 1 / 10000, samplerate: this.sampleRate, centerFrequency: this.centerFrequency, bins: 4096, width: 4096, height: 800},
      disconnected: false
    }
  },
  methods: {
    disconnect: function () {
      // Close websocket
      Websocket.emit('stop', 'disconnect', () => {
        Websocket.offEvent('connect')
        Websocket.offEvent('fft')
        Websocket.close()
      })
      // close device
      Service.get('/devices/close/' + this.serialNumber).then(response => {
        this.$router.push({path: '/'})
      })
      this.disconnected = true
    }
  },
  watch: {
  },
  directives: {
    drawFft: function (canvasElement, binding) {
      // Get canvas context
      var fft = binding.value
      var ctx = canvasElement.getContext('2d')
      var imageFFT = null
      // One line width * pixel size [RGBA]
      var sizeOneLine = fft.width * 4
      var bufferRGBA = new Uint8Array(sizeOneLine)
      // setup canvas
      canvasElement.width = fft.width
      canvasElement.height = fft.height
      // Initialize image
      imageFFT = ctx.createImageData(fft.width, fft.height - 20)
      // font
      ctx.font = '11px Arial'
      // draw grid
      ctx.beginPath()
      ctx.moveTo(0, fft.height - 20)
      ctx.lineTo(fft.width, fft.height - 20)

      // draw frequency line each 10
      for (var i = 1; i < fft.bins; i += 500) {
        ctx.moveTo(i, fft.height - 20)
        ctx.lineTo(i, fft.height - 10)
        ctx.fillText(Math.round(fft.samplerate / fft.bins * i * fft.scale), i - 25, fft.height)
      }
      ctx.stroke()

      function render () {
        ctx.putImageData(imageFFT, 0, 0)
      }

      // Bind event data
      Websocket.onEvent('fft', (data) => {
        var buffer = new Int16Array(data)
        // Split received buffer in bins
        for (let i = 0; i < buffer.length; i += fft.bins) {
          var line = buffer.slice(i, i + fft.bins)
          // Convert buffer to RGBA
          for (let c = 0; c < line.length; c++) {
            // Red / Green / blue / Alpha
            // var red = 255 * Math.abs(Math.sin(line[c] / 16384 * 3.1415927 * 3 / 2))
            // var green = 255 * Math.sin(line[c] / 16384 * 3.1415927)
            // var blue = 255 * Math.abs(Math.sin(line[c] / 16384 * 3.1415927 * 5 / 2))
            var red = Math.round(120 * buffer[c] / 16384)
            var green = Math.round(20 * buffer[c] / 16384)
            var blue = 230 + Math.round(120 * buffer[c] / 16384)
            bufferRGBA.set([red, green, blue, 255], c * 4)
          }
          // Scroll image down
          var tmpData = imageFFT.data.subarray(0, imageFFT.data.length - sizeOneLine)
          imageFFT.data.set(bufferRGBA)
          imageFFT.data.set(tmpData, bufferRGBA.length)
          requestAnimationFrame(render)
        }
      })
    }
  },
  created: function () {
    if (this.$route.params != null) {
      // Prepare websocket connection
      this.serialNumber = this.$route.params.serialNumber
      // Connect to socket serial number
      Websocket.connect(this.$route.params.serialNumber)
      Websocket.onceEvent('connect', () => {
        Websocket.emit('start', 'test')
      })
    }
  },
  destroyed: function () {
    if (!this.disconnected) {
      // Close websocket
      Websocket.emit('stop', 'disconnect', () => {
        Websocket.offEvent('connect')
        Websocket.offEvent('fft')
        Websocket.close()
      })
      // close device
      Service.get('/devices/close/' + this.serialNumber).then(response => {
        this.$router.push({path: '/'})
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.spacing {
  padding : 15px;
}
.spectrum {
  border:1px solid #BBB;
  width: 800;
  height: 200px;
}
</style>
