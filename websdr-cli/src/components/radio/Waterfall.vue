<template>
  <md-layout md-gutter>
    <md-layout md-hide-medium></md-layout>
    <md-layout>
      <md-layout class="spacing" md-column>
        <md-card md-with-hover>
          <md-card-header>
              <md-card-header-text>
                <div class="md-title">Waterfall</div>
                <div class="md-subhead">FFT size is {{fftdata.bins}}</div>
              </md-card-header-text>

              <md-menu md-size="4" md-direction="bottom left">
                <md-button class="md-icon-button" md-menu-trigger>
                  <md-icon>more_vert</md-icon>
                </md-button>

                <md-menu-content>
                  <md-menu-item>
                    <span>Move</span>
                    <md-icon>zoom_out_map</md-icon>
                  </md-menu-item>
                </md-menu-content>
              </md-menu>
            </md-card-header>        
          <md-card-media>
            <canvas class="spectrum" v-draw-fft="fftdata"></canvas>

            <md-ink-ripple></md-ink-ripple>
          </md-card-media>

          <md-card-actions>
            <md-button class="md-icon-button" @click="disconnect()">
              <md-icon>exit_to_app</md-icon>
            </md-button>
          </md-card-actions>
        </md-card>      
        </md-layout>
    </md-layout>
    <md-layout md-hide-medium></md-layout>
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
      default: 106100000
    }
  },
  data () {
    return {
      serialNumber: '',
      fftdata: {scale: 1 / 10000, HSVtoRGB: this.HSVtoRGB, samplerate: this.sampleRate, centerFrequency: this.centerFrequency, bins: 4096, width: 4096, height: 600},
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
    },
    HSVtoRGB: function (h, s, v) {
      var r, g, b, i, f, p, q, t
      if (arguments.length === 1) {
        s = h.s
        v = h.v
        h = h.h
      }
      i = Math.floor(h * 6)
      f = h * 6 - i
      p = v * (1 - s)
      q = v * (1 - f * s)
      t = v * (1 - (1 - f) * s)
      switch (i % 6) {
        case 0:
          r = v
          g = t
          b = p
          break
        case 1:
          r = q
          g = v
          b = p
          break
        case 2:
          r = p
          g = v
          b = t
          break
        case 3:
          r = p
          g = q
          b = v
          break
        case 4:
          r = t
          g = p
          b = v
          break
        case 5:
          r = v
          g = p
          b = q
          break
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      }
    }
  },
  watch: {
  },
  directives: {
    drawFft: function (canvasElement, binding) {
      // Get canvas context
      const fft = binding.value
      var ctx = canvasElement.getContext('2d')
      var imageFFT = null
      // One line width * pixel size [RGBA]
      var sizeOneLine = fft.width * 4
      var bufferRGBA = new Uint8Array(sizeOneLine)
      // setup canvas
      canvasElement.width = fft.width + 40
      canvasElement.height = fft.height + 40
      // Initialize image
      imageFFT = ctx.createImageData(fft.width, fft.height - 100)
      // font
      ctx.font = 'bold 54px Arial'
      // draw grid
      ctx.beginPath()
      // Draw component contour
      ctx.lineWidth = '4'
      ctx.strokeStyle = 'white'
      ctx.rect(18, 18, fft.width + 2, fft.height + 2)

      ctx.lineWidth = '6'
      ctx.moveTo(20, fft.height - 78)
      ctx.lineTo(20 + fft.width, fft.height - 78)
      var baseFrequency = (fft.centerFrequency - (fft.samplerate / 2))
      ctx.lineWidth = '8'
      // draw frequency line each 10
      var step = fft.bins / 6
      for (var i = step; i < fft.bins - step; i += step) {
        ctx.moveTo(i + 18, fft.height - 78)
        ctx.lineTo(i + 18, fft.height - 58)
        var frequency = baseFrequency + Math.round((fft.samplerate / fft.bins) * i)
        var unit = ' KHz'
        if (frequency > 1000) {
          unit = ' MHz'
        }
        frequency = (frequency > 1000) ? (frequency / 1000000) : (frequency / 1000)
        // round frequency
        frequency = Math.round(frequency * 100) / 100
        ctx.fillStyle = '#ffffff'
        ctx.fillText(frequency + unit, i + 18 - 25, fft.height - 10)
      }
      ctx.stroke()

      function render () {
        ctx.putImageData(imageFFT, 20, 20)
      }

      // Bind event data
      Websocket.onEvent('fft', (data) => {
        const buffer = new Int8Array(data)
        // Split received buffer in bins
        for (let i = 0; i < buffer.length; i += fft.bins) {
          var line = buffer.slice(i, i + fft.bins)
          // Convert buffer to RGBA
          for (let c = 0; c < line.length; c++) {
            // HSV
            const color = fft.HSVtoRGB(0.75 - (1 + buffer[c] / 100) / 2, 0.7, 0.8)
            bufferRGBA.set([color.r, color.g, color.b, 255], c * 4)
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
  background: black;
}
</style>
