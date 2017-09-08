<template>
        <div ref="parent" class="full-size">
          <canvas ref="spectrum" class="spectrum"></canvas>
          <canvas ref="overlay" class="freq-overlay"></canvas>
        </div>
<!--   <v-container fluid class="full-size">
    <v-layout class="full-size">
      <v-flex xs12 align-end flexbox class="full-size">
      </v-flex>
    </v-layout>
  </v-container>
 --></template>

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
      width: 4116,
      height: 1000,
      waterfallHeight: 471,
      waterfallYOffset: 500,
      fftHeight: 440,
      fftdata: {scale: 1 / 10000},
      overlayPos: {x: 0, y: 0},
      overlayCanvas: null,
      waterfallCanvas: null,
      disconnected: false,
      bufferRGBA: null,
      imageFFT: null,
      spectrumCtx: null,
      overlayCtx: null,
      level: 56,
      scaleX: 0.26,
      scaleY: 0.26,
      topMargin: 12,
      bottomMargin: 12,
      leftMargin: 8,
      rightMargin: 8

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
      const tunedFrequencyPosition = (diff / binSize + this.bins / 2) + this.leftMargin
      ctx.beginPath()
      // Draw frequency selection
      ctx.lineWidth = '10'
      ctx.strokeStyle = 'red'
      ctx.moveTo(tunedFrequencyPosition, this.topMargin)
      ctx.lineTo(tunedFrequencyPosition, this.topMargin + this.fftHeight - this.bottomMargin)
      ctx.stroke()
      // draw lower bandwidth
      ctx.beginPath()
      ctx.lineWidth = '4'
      ctx.strokeStyle = 'white'
      if (this.modulationType !== 'USB') {
        ctx.moveTo(tunedFrequencyPosition - bwPix / 2, this.topMargin)
        ctx.lineTo(tunedFrequencyPosition - bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      }
      // draw upper bandwidth
      if (this.modulationType !== 'LSB') {
        ctx.moveTo(tunedFrequencyPosition + bwPix / 2, this.topMargin)
        ctx.lineTo(tunedFrequencyPosition + bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      }
      ctx.stroke()
      // slight overlay of area
      ctx.fillStyle = 'rgba(225,225,255,0.2)'
      if (this.modulationType === 'USB') {
        ctx.fillRect(tunedFrequencyPosition, this.topMargin, bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      } else if (this.modulationType === 'LSB') {
        ctx.fillRect(tunedFrequencyPosition - bwPix / 2, this.topMargin, bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      } else {
        ctx.fillRect(tunedFrequencyPosition - bwPix / 2, this.topMargin, bwPix, this.topMargin + this.fftHeight - this.bottomMargin)
      }
    },
    drawFrequency: function (ctx, overlay) {
      this.drawTunedFrequency(ctx)
      // limit bounding
      if (overlay.x < this.leftMargin) return
      if (overlay.x > this.width - this.rightMargin) return
      // compute binSize
      const binSize = this.sampleRate / this.bins
      // bandwidth in pixel
      const bwPix = this.currentBandwidth / binSize
      ctx.beginPath()
      // Draw frequency selection
      ctx.lineWidth = '10'
      ctx.strokeStyle = 'red'
      ctx.moveTo(overlay.x, this.topMargin)
      ctx.lineTo(overlay.x, this.topMargin + this.fftHeight - this.bottomMargin)
      ctx.stroke()
      // draw lower bandwidth
      ctx.beginPath()
      ctx.lineWidth = '4'
      ctx.strokeStyle = 'white'
      if (this.modulationType !== 'USB') {
        ctx.moveTo(overlay.x - bwPix / 2, this.topMargin)
        ctx.lineTo(overlay.x - bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      }
      // draw upper bandwidth
      if (this.modulationType !== 'LSB') {
        ctx.moveTo(overlay.x + bwPix / 2, this.topMargin)
        ctx.lineTo(overlay.x + bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      }
      ctx.stroke()
      // slight overlay of area
      ctx.fillStyle = 'rgba(225,225,255,0.2)'
      if (this.modulationType === 'USB') {
        ctx.fillRect(overlay.x, this.topMargin, bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      } else if (this.modulationType === 'LSB') {
        ctx.fillRect(overlay.x - bwPix / 2, this.topMargin, bwPix / 2, this.topMargin + this.fftHeight - this.bottomMargin)
      } else {
        ctx.fillRect(overlay.x - bwPix / 2, this.topMargin, bwPix, this.topMargin + this.fftHeight - this.bottomMargin)
      }
    },
    getMousePos: function (canvas, evt) {
      var rect = canvas.getBoundingClientRect()
      return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width * 1 / this.scaleX,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height * 1 / this.scaleY
      }
    },
    bandwidthChange: function (evt) {
      var e = window.event || evt // old IE support
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
      this.changeBandwidth(this.currentBandwidth + delta * 5000)
    },
    drawOverlay: function (ctx, overlay) {
      const canvasElement = this.$refs.overlay
      const canvasWidth = canvasElement.width * 1 / this.scaleX
      const canvasHeight = canvasElement.height * 1 / this.scaleY
      canvasElement.addEventListener('mousemove', (evt) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        this.overlay = this.getMousePos(canvasElement, evt)
        this.drawFrequency(ctx, this.overlay)
      }, false)
      canvasElement.addEventListener('mousewheel', (evt) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        this.overlay = this.getMousePos(canvasElement, evt)
        this.bandwidthChange(evt)
        this.drawFrequency(ctx, this.overlay)
      }, false)
      canvasElement.addEventListener('DOMMouseScroll', (evt) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        this.overlay = this.getMousePos(canvasElement, evt)
        this.bandwidthChange(evt)
        this.drawFrequency(ctx, this.overlay)
      }, false)
      canvasElement.addEventListener('click', (evt) => {
        // compute frequency from click
        const bin = this.getMousePos(canvasElement, evt).x - this.leftMargin
        var baseFrequency = (this.centerFrequency - (this.sampleRate / 2))
        let frequency = baseFrequency + bin * this.sampleRate / this.bins
        // Snap to grid ?
        frequency = Math.round(frequency / this.stepFrequency) * this.stepFrequency
        this.changeFrequency(frequency)
      })
    },
    drawFFT: function (ctx, data) {
      // clear rectangle
      const scale = (this.fftHeight - this.bottomMargin) / 255
      ctx.clearRect(this.leftMargin + 1, this.topMargin + 1, this.bins, this.fftHeight)
      // draw line
      ctx.beginPath()
      ctx.lineWidth = '2'
      ctx.strokeStyle = 'lightgray'
      var step = this.bins / 6
      for (let i = step; i < this.bins - step; i += step) {
        ctx.moveTo(i + this.leftMargin, this.topMargin)
        ctx.lineTo(i + this.leftMargin, this.topMargin + this.fftHeight)
      }
      ctx.lineWidth = '0.5'
      step = this.fftHeight / 5
      for (let y = step; y < this.fftHeight; y += step) {
        ctx.moveTo(this.leftMargin + 1, this.topMargin + y)
        ctx.lineTo(this.leftMargin + this.bins, this.topMargin + y)
      }
      ctx.stroke()
      ctx.beginPath()
      ctx.lineWidth = '2'
      ctx.strokeStyle = 'white'
      for (let i = 0; i < this.bins; i++) {
        if (i === 0) {
          ctx.moveTo(this.leftMargin + 1 + i, this.topMargin + this.fftHeight - data[i] * scale)
        } else {
          ctx.lineTo(this.leftMargin + 1 + i, this.topMargin + this.fftHeight - data[i] * scale)
        }
      }
      // properly close path
      ctx.lineTo(this.leftMargin + this.bins + 1, this.topMargin + this.fftHeight + 10)
      ctx.lineTo(this.leftMargin + 1, this.topMargin + this.fftHeight + 10)
      ctx.closePath()
      ctx.fillStyle = 'rgba(30,30,30,0.8)'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.stroke()
    },
    drawWaterfall: function (ctx, fft) {
      // Initialize image
      if (this.imageFFT == null) {
        this.imageFFT = ctx.createImageData(this.bins, this.waterfallHeight)
      }
      // font
      ctx.font = 'bold 35px Courier New'
      // draw grid
      ctx.beginPath()
      // Draw component contour
      ctx.lineWidth = '6'
      ctx.strokeStyle = 'white'
      ctx.rect(this.leftMargin, this.topMargin, this.bins + 4, this.height - (this.bottomMargin + this.topMargin))

      // Draw text with frequences
      ctx.lineWidth = '4'
      ctx.moveTo(this.leftMargin + 1, this.topMargin + this.fftHeight + 10)
      ctx.lineTo(this.bins + 4, this.topMargin + this.fftHeight + 10)
      // separator line with waterfall
      ctx.lineWidth = '4'
      ctx.moveTo(this.leftMargin + 1, this.waterfallYOffset + this.topMargin)
      ctx.lineTo(this.bins + 4, this.waterfallYOffset + this.topMargin)

      var baseFrequency = (this.centerFrequency - (this.sampleRate / 2))
      ctx.lineWidth = '4'
      // draw frequency line each 10
      var step = this.bins / 8
      for (var i = step; i < this.bins - step; i += step) {
        ctx.moveTo(i + this.leftMargin, this.fftHeight + this.topMargin + 10)
        ctx.lineTo(i + this.leftMargin, this.fftHeight + this.topMargin + 20)
        var frequency = baseFrequency + Math.round((this.sampleRate / this.bins) * i)
        var unit = ' KHz'
        if (frequency > 1000) {
          unit = ' MHz'
        }
        frequency = (frequency > 1000) ? (frequency / 1000000) : (frequency / 1000)
        // round frequency
        frequency = Math.round(frequency * 100) / 100
        ctx.fillStyle = '#ffffff'
        ctx.fillText(frequency + unit, i + this.leftMargin - 35, this.fftHeight + this.topMargin + 45)
      }
      ctx.stroke()
      // ctx.scale(this.scaleX, this.scaleY)
    },
    reDraw: function (line) {
      // Scroll image down
      var tmpData = this.imageFFT.data.subarray(0, this.imageFFT.data.length - this.bins * 4)
      this.imageFFT.data.set(this.bufferRGBA)
      this.imageFFT.data.set(tmpData, this.bufferRGBA.length)
      requestAnimationFrame(() => {
        this.spectrumCtx.putImageData(this.imageFFT, this.leftMargin + 1, this.waterfallYOffset + this.topMargin + 1)
        this.drawFFT(this.spectrumCtx, line)
      })
    }
  },
  watch: {
    modulationType (value) {
      this.drawTunedFrequency(this.overlayCtx)
    },
    centerFrequency () {
      this.drawWaterfall(this.spectrumCtx, this.fftdata)
    },
    tunedFrequency (value) {
      this.drawTunedFrequency(this.overlayCtx)
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
          this.reDraw(line)
        }
      })
    }
  },
  mounted: function () {
    if (this.$route.params != null) {
      this.$nextTick(() => {
        window.addEventListener('resize', () => {
          this.$refs.overlay.style.width = this.$refs.parent.clientWidth + 'px'
          this.$refs.overlay.style.height = this.$refs.parent.clientHeight + 'px'
          this.$refs.spectrum.style.width = this.$refs.parent.clientWidth + 'px'
          this.$refs.spectrum.style.height = this.$refs.parent.clientHeight + 'px'
        })
        // this.width = this.$refs.parent.clientWidth - 40
        // this.height = this.$refs.parent.clientHeight - 40
        this.$refs.overlay.style.width = this.$refs.parent.clientWidth + 'px'
        this.$refs.overlay.style.height = this.$refs.parent.clientHeight + 'px'
        this.$refs.spectrum.style.width = this.$refs.parent.clientWidth + 'px'
        this.$refs.spectrum.style.height = this.$refs.parent.clientHeight + 'px'
        this.$refs.overlay.width = this.width // this.$refs.parent.clientWidth - 40
        this.$refs.overlay.height = this.height // this.$refs.parent.clientHeight - 40
        this.$refs.spectrum.width = this.width // this.$refs.parent.clientWidth - 40
        this.$refs.spectrum.height = this.height // this.$refs.parent.clientHeight - 40
        // scale
        this.scaleX = 1.0 // (this.$refs.parent.clientWidth - 40) / this.width
        this.scaleY = 1.0 // (this.$refs.parent.clientHeight - 40) / this.height
        // Prepare websocket connection
        this.serialNumber = this.$route.params.serialNumber
        // Initial buffer
        this.bufferRGBA = new Uint8Array(this.bins * 4)
        // Draw once connected
        this.spectrumCtx = this.$refs.spectrum.getContext('2d')
        this.overlayCtx = this.$refs.overlay.getContext('2d')
        this.drawOverlay(this.overlayCtx, this.overlayPos)
        this.drawWaterfall(this.spectrumCtx, this.fftdata)
      })
    }
  },
  updated: function () {
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
  /*padding: 0px;*/
}
.full-size {
  width: 100%;
  height: 100%;
  padding: 0px;
}
.spacing {
/*  padding : 15px;*/
}
.fake {
  width: 100%;
  height: 100%;
}
.spectrum {
  position: absolute;
  border:1px solid #BBB;
/*  width: 100%;
  height: 100%;
*/  background: black;
  z-index: 0;
}
.freq-overlay {
  position: absolute;
/*  width: 100%;
  height: 100%;
*/  z-index: 1;
}
</style>
