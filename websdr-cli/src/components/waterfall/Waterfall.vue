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
      fftdata: {width: 512, height: 200}
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
      imageFFT = ctx.createImageData(fft.width, fft.height)

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
        var tmpData = imageFFT.data.slice(0, imageFFT.data.length - sizeOneLine)
        imageFFT.data.set(bufferRGBA)
        imageFFT.data.set(tmpData, bufferRGBA.length)
        // ctx.putImageData(imageFFT, 0, 0)
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
