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
  data () {
    return {
      serialNumber: '',
      fftdata: {samplerate: 200000, bins: 512, width: 512, height: 200}
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

      // draw frequency line
      for (var i = 1; i < fft.bins; i += 1) {
        ctx.moveTo(i * fft.width / 10, fft.height - 20)
        ctx.lineTo(i * fft.width / 10, fft.height - 10)
        ctx.fillText(Math.round(fft.samplerate / fft.bins * i), i * fft.width / 10 - 5, fft.height)
      }
      ctx.stroke()

      function render () {
        ctx.putImageData(imageFFT, 0, 0)
      }

      // Bind event data
      Websocket.onEvent('fft', (data) => {
        var buffer = new Int16Array(data)
        // Convert buffer to RGBA
        for (let c = 0; c < buffer.length; c++) {
          // Red / Green / blue / Alpha
          var red = 0 + Math.round((200 - 0) * (buffer[c] / 100))
          var green = 0 + Math.round((1 - 0) * (buffer[c] / 100))
          var blue = 240 + Math.round((0 - 240) * (buffer[c] / 100))
          bufferRGBA.set([red, green, blue, 255], c * 4)
        }
        // Scroll image down
        var tmpData = imageFFT.data.subarray(0, imageFFT.data.length - sizeOneLine)
        imageFFT.data.set(bufferRGBA)
        imageFFT.data.set(tmpData, bufferRGBA.length)
        requestAnimationFrame(render)
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
