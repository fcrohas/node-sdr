<template>
    <v-container fluid class="full-size">
      <v-layout column class="full-size">
        <v-flex xs12 class="full-size">
          <div class="full-size">
            <canvas ref="spectrum" class="spectrum"></canvas>
            <canvas ref="overlay" class="freq-overlay"></canvas>
          </div>
        </v-flex>
      </v-layout>
    </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Websocket from '../../service/websocket-cli'

export default {
  name: 'waterfall',
  props: {
    frequency: {
      type: Number,
      default: 105800000
    }
  },
  computed: mapGetters({
    tunedFrequency: 'tunedFrequency',
    currentBandwidth: 'currentBandwidth',
    centerFrequency: 'centerFrequency',
    isConnected: 'isConnected',
    sampleRate: 'sampleRate',
    modulationType: 'modulationType',
    stepFrequency: 'stepFrequency'
  }),
  data () {
    return {
      serialNumber: '',
      bins: 4096,
      width: 4096,
      height: 600,
      fftdata: {scale: 1 / 10000},
      overlayPos: {x: 0, y: 0},
      overlayCanvas: null,
      waterfallCanvas: null,
      disconnected: false,
      bufferRGBA: null,
      imageFFT: null,
      spectrumCtx: null,
      level: 56
    }
  },
  methods: {
    ...mapActions([
      'changeFrequency',
      'changeBandwidth',
      'connect',
      'disconnect'
    ]),
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
    },
    drawTunedFrequency (ctx) {
      // compute binSize
      const binSize = this.sampleRate / this.bins
      // bandwidth in pixel
      const bwPix = this.currentBandwidth / binSize
      // Compute frequency diff
      const diff = this.tunedFrequency - this.centerFrequency
      // convert to pixel
      const tunedFrequencyPosition = (diff / binSize + this.bins / 2) + 20
      ctx.beginPath()
      // Draw frequency selection
      ctx.lineWidth = '10'
      ctx.strokeStyle = 'red'
      ctx.moveTo(tunedFrequencyPosition, 28)
      ctx.lineTo(tunedFrequencyPosition, this.height - 88)
      ctx.stroke()
      // draw lower bandwidth
      ctx.beginPath()
      ctx.lineWidth = '4'
      ctx.strokeStyle = 'white'
      if (this.modulationType !== 'USB') {
        ctx.moveTo(tunedFrequencyPosition - bwPix / 2, 28)
        ctx.lineTo(tunedFrequencyPosition - bwPix / 2, this.height - 88)
      }
      // draw upper bandwidth
      if (this.modulationType !== 'LSB') {
        ctx.moveTo(tunedFrequencyPosition + bwPix / 2, 28)
        ctx.lineTo(tunedFrequencyPosition + bwPix / 2, this.height - 88)
      }
      ctx.stroke()
      // slight overlay of area
      ctx.fillStyle = 'rgba(225,225,255,0.2)'
      if (this.modulationType === 'USB') {
        ctx.fillRect(tunedFrequencyPosition, 28, bwPix / 2, this.height - 116)
      } else if (this.modulationType === 'LSB') {
        ctx.fillRect(tunedFrequencyPosition - bwPix / 2, 28, bwPix / 2, this.height - 116)
      } else {
        ctx.fillRect(tunedFrequencyPosition - bwPix / 2, 28, bwPix, this.height - 116)
      }
    },
    drawFrequency: function (ctx, overlay) {
      this.drawTunedFrequency(ctx)
      // limit bounding
      if (overlay.x < 20) return
      if (overlay.x > 20 + this.width) return
      // compute binSize
      const binSize = this.sampleRate / this.bins
      // bandwidth in pixel
      const bwPix = this.currentBandwidth / binSize
      ctx.beginPath()
      // Draw frequency selection
      ctx.lineWidth = '10'
      ctx.strokeStyle = 'red'
      ctx.moveTo(overlay.x, 28)
      ctx.lineTo(overlay.x, this.height - 88)
      ctx.stroke()
      // draw lower bandwidth
      ctx.beginPath()
      ctx.lineWidth = '4'
      ctx.strokeStyle = 'white'
      if (this.modulationType !== 'USB') {
        ctx.moveTo(overlay.x - bwPix / 2, 28)
        ctx.lineTo(overlay.x - bwPix / 2, this.height - 88)
      }
      // draw upper bandwidth
      if (this.modulationType !== 'LSB') {
        ctx.moveTo(overlay.x + bwPix / 2, 28)
        ctx.lineTo(overlay.x + bwPix / 2, this.height - 88)
      }
      ctx.stroke()
      // slight overlay of area
      ctx.fillStyle = 'rgba(225,225,255,0.2)'
      if (this.modulationType === 'USB') {
        ctx.fillRect(overlay.x, 28, bwPix / 2, this.height - 116)
      } else if (this.modulationType === 'LSB') {
        ctx.fillRect(overlay.x - bwPix / 2, 28, bwPix / 2, this.height - 116)
      } else {
        ctx.fillRect(overlay.x - bwPix / 2, 28, bwPix, this.height - 116)
      }
    },
    getMousePos: function (canvas, evt) {
      var rect = canvas.getBoundingClientRect()
      return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
      }
    },
    bandwidthChange: function (evt) {
      var e = window.event || evt // old IE support
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
      this.changeBandwidth(this.currentBandwidth + delta * 5000)
    },
    drawOverlay: function (canvasElement, overlay) {
      // Get canvas context
      var ctx = canvasElement.getContext('2d')
      canvasElement.width = this.width + 40
      canvasElement.height = this.height + 40
      canvasElement.addEventListener('mousemove', (evt) => {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        this.overlay = this.getMousePos(canvasElement, evt)
        this.drawFrequency(ctx, this.overlay)
      }, false)
      canvasElement.addEventListener('mousewheel', (evt) => {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        this.overlay = this.getMousePos(canvasElement, evt)
        this.bandwidthChange(evt)
        this.drawFrequency(ctx, this.overlay)
      }, false)
      canvasElement.addEventListener('DOMMouseScroll', (evt) => {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        this.overlay = this.getMousePos(canvasElement, evt)
        this.bandwidthChange(evt)
        this.drawFrequency(ctx, this.overlay)
      }, false)
      canvasElement.addEventListener('click', (evt) => {
        // compute frequency from click
        const bin = this.getMousePos(canvasElement, evt).x - 20
        var baseFrequency = (this.centerFrequency - (this.sampleRate / 2))
        let frequency = baseFrequency + bin * this.sampleRate / this.bins
        // Snap to grid ?
        frequency = Math.round(frequency / this.stepFrequency) * this.stepFrequency
        this.changeFrequency(frequency)
      })
    },
    drawWaterfall: function (canvasElement, fft) {
      // Get canvas context
      var ctx = canvasElement.getContext('2d')
      this.spectrumCtx = ctx
      // setup canvas
      canvasElement.width = this.width + 40
      canvasElement.height = this.height + 40
      // Initialize image
      if (this.imageFFT == null) {
        this.imageFFT = ctx.createImageData(this.width, this.height - 100)
      }
      // font
      ctx.font = 'bold 54px Arial'
      // draw grid
      ctx.beginPath()
      // Draw component contour
      ctx.lineWidth = '4'
      ctx.strokeStyle = 'white'
      ctx.rect(18, 18, this.width + 2, this.height + 2)

      ctx.lineWidth = '6'
      ctx.moveTo(20, this.height - 78)
      ctx.lineTo(20 + this.width, this.height - 78)
      var baseFrequency = (this.centerFrequency - (this.sampleRate / 2))
      ctx.lineWidth = '8'
      // draw frequency line each 10
      var step = this.bins / 6
      for (var i = step; i < this.bins - step; i += step) {
        ctx.moveTo(i + 18, this.height - 78)
        ctx.lineTo(i + 18, this.height - 58)
        var frequency = baseFrequency + Math.round((this.sampleRate / this.bins) * i)
        var unit = ' KHz'
        if (frequency > 1000) {
          unit = ' MHz'
        }
        frequency = (frequency > 1000) ? (frequency / 1000000) : (frequency / 1000)
        // round frequency
        frequency = Math.round(frequency * 100) / 100
        ctx.fillStyle = '#ffffff'
        ctx.fillText(frequency + unit, i + 18 - 25, this.height - 10)
      }
      ctx.stroke()
    },
    reDraw: function () {
      // Scroll image down
      var tmpData = this.imageFFT.data.subarray(0, this.imageFFT.data.length - this.width * 4)
      this.imageFFT.data.set(this.bufferRGBA)
      this.imageFFT.data.set(tmpData, this.bufferRGBA.length)
      requestAnimationFrame(() => {
        this.spectrumCtx.putImageData(this.imageFFT, 20, 20)
      })
    }
  },
  watch: {
    modulationType (value) {
      this.drawTunedFrequency(this.$refs.overlay.getContext('2d'))
    },
    centerFrequency () {
      this.drawWaterfall(this.$refs.spectrum, this.fftdata)
    },
    tunedFrequency (value) {
      this.drawTunedFrequency(this.$refs.overlay.getContext('2d'))
    },
    isConnected (value) {
      if (!value) {
        Websocket.offEvent('fft')
        return
      }
      // Bind event data
      Websocket.onEvent('fft', (data) => {
        const buffer = new Uint8Array(data)
        // Split received buffer in bins
        for (let i = 0; i < buffer.length; i += this.bins) {
          var line = buffer.subarray(i, i + this.bins)
          // Convert buffer to RGBA
          for (let c = 0; c < line.length; c++) {
            // HSV
            const color = this.HSVtoRGB(this.level / 10 - line[c] / 255, 0.7, 0.8)
            this.bufferRGBA.set([color.r, color.g, color.b, 255], c * 4)
          }
          this.reDraw()
        }
      })
    }
  },
  mounted: function () {
    if (this.$route.params != null) {
      // Prepare websocket connection
      this.serialNumber = this.$route.params.serialNumber
      // Initial buffer
      this.bufferRGBA = new Uint8Array(this.width * 4)
      // Draw once connected
      this.drawOverlay(this.$refs.overlay, this.overlayPos)
      this.drawWaterfall(this.$refs.spectrum, this.fftdata)
    }
  },
  destroyed: function () {
    if (!this.disconnected) {
      this.disconnect()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.header-size {
  height: 90px;
  max-height: 90px;
  min-height: 90px;
}
.full-height {
  height: 100%;
}
.full-size-90 {
  width: 100%;
  height: calc(100%-90px);
  padding: 0px;
}
.full-size {
  width: 100%;
  height: 100%;
  padding: 0px;
}
.spacing {
  padding : 15px;
}
.fake {
  width: 100%;
  height: 100%;
}
.spectrum {
  position: absolute;
  border:1px solid #BBB;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 0;
}
.freq-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
