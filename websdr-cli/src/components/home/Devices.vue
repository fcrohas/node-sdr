<template>
    <md-layout md-gutter class="spacing">
        <md-layout md-hide-medium></md-layout>
        <md-layout>
          <md-layout md-column v-for="(devices,index) in devicesByColumns(devices,2)">
            <md-layout class="spacing" v-for="(device,index) in devices" key="device.serialNumber">
              <md-card>
                <md-card-media-cover md-solid>
                  <md-card-media md-ratio="1:4">
                    <img v-if="device.type=='rtlsdr'" src="static/img/rtlsdrv3.jpg" alt="Dongle generic">
                  </md-card-media>
                  <md-card-media md-ratio="1:4">
                    <img v-if="device.type=='sdrplay'" src="static/img/SDRplay-RSP2.jpg" alt="SDRPlay">
                  </md-card-media>

                  <md-card-area>
                    <md-card-header>
                      <div class="md-title">{{device.deviceName}}</div>
                      <div class="md-subhead">{{device.serialNumber}}</div>
                    </md-card-header>

                    <md-card-actions>
                      <md-button @click="connect(device.serialNumber)">Connect</md-button>
                    </md-card-actions>
                  </md-card-area>
                </md-card-media-cover>
              </md-card>
            </md-layout>
          </md-layout>
        </md-layout>
        <md-layout md-hide-medium></md-layout>
    </md-layout>
</template>

<script>
import Service from '../../service/api'
export default {

  name: 'Devices',
  props: {
    devices: {
      type: Array
    }
  },
  data () {
    return {

    }
  },
  methods: {
    devicesByColumns: function (devices, size) {
      var result = []
      // default size to two item
      size = parseInt(size) || 2

      // Cut array
      for (var x = 0; x < Math.ceil(devices.length / size); x++) {
        var start = x * size
        var end = start + size

        result.push(devices.slice(start, end))
      }

      return result
    },
    connect: function (serialNumber) {
      Service.get('/devices/open/' + serialNumber).then(response => {
        this.$router.push({path: 'spectrum/' + serialNumber})
      }).catch(e => {
        /* Error try to send a close */
        Service.get('/devices/close/' + serialNumber).then(response => {
        })
      })
    }
  }
}
</script>

<style lang="css" scoped>
.spacing {
  padding:10px;
}
</style>