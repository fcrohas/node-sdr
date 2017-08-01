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
      fftdata: {line: 0, lineSkip: 0, data: [], width: 512, height: 200},
      lineTime: 0
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
      var imageData = null
      if (fft.line === 0) {
        canvasElement.width = fft.width
        canvasElement.height = fft.height
        imageData = ctx.createImageData(fft.width, fft.height)
      } else {
        // Scroll if bottom reached
        imageData = ctx.getImageData(0, fft.lineSkip, fft.width, fft.height + fft.lineSkip)
      }
      for (var i = 0; i < fft.data.length; i++) {
        var index = (i + fft.line * fft.width) * 4
        var value = fft.data[i]
        if (value <= 12) {
          imageData.data[index + 0] = 0
          imageData.data[index + 1] = 0
          imageData.data[index + 2] = value
        }
        if ((value >= 12) && (value <= 64)) {
          imageData.data[index + 0] = 0
          imageData.data[index + 1] = value
          imageData.data[index + 2] = value + 30
        }
        if ((value >= 64) && (value <= 240)) {
          imageData.data[index + 0] = value + 60
          imageData.data[index + 1] = value + 60
          imageData.data[index + 2] = 0
        }
        if (value >= 240) {
          imageData.data[index + 0] = value + 30
          imageData.data[index + 1] = 0
          imageData.data[index + 2] = 0
        }
        imageData.data[index + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
  },
  created: function () {
    if (this.$route.params != null) {
      this.serialNumber = this.$route.params.serialNumber
      // Connect to socket serial number
      Websocket.connect(this.$route.params.serialNumber)
      Websocket.onEvent('connect', () => {
        Websocket.emit('start', 'test')
      })
      Websocket.onEvent('fft', (data) => {
        var buffer = new Int16Array(data)
        // Check if scroll is needed
        if (this.lineTime >= this.fftdata.height) {
          this.fftdata.lineSkip = 2
        } else {
          this.fftdata.lineSkip = 0
        }
        this.fftdata.data = buffer
        this.fftdata.line = this.lineTime - this.fftdata.lineSkip
        this.lineTime += 1 - this.fftdata.lineSkip
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
