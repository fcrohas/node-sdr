<template>
  <div>
    <canvas></canvas>
    <md-button @click="disconnect()" class="md-raised">Close</md-button>
  </div>
</template>

<script>
import Websocket from '../../service/websocket'
import Service from '../../service/api'

export default {
  name: 'waterfall',
  props: ['serialNumber'],
  data () {
    return {
      serialNumber: ''
    }
  },
  methods: {
    disconnect: function () {
      // Close websocket
      Websocket.close()
      // close device
      Service.get('/devices/close/' + this.serialNumber).then(response => {
        this.$router.push({path: '/'})
      })
    }
  },
  watch: {
    serialNumber: function (serial) {
      Websocket.connect(serial)
    }
  },
  mounted () {
    if (this.$route.params != null) {
      this.serialNumber = this.$route.params.serialNumber
      // Connect to socket serial number
      Websocket.connect(this.$route.params.serialNumber)
      // listen event
      Websocket.send('start')
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
