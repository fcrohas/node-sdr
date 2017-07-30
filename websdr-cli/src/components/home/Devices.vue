<template>
    <md-layout md-gutter="16px">
        <md-layout md-gutter="16px">
            <md-card v-for="(device,index) in devices" key="device.serialNumber">
              <md-card-media-cover md-solid>
                <md-card-media md-ratio="1:4">
                  <img v-if="device.type=='rtlsdr'" src="static/img/rtlsdrv3.jpg" alt="Dongle generic">
                </md-card-media>
                <md-card-media md-ratio="1:8">
                  <img v-if="device.type=='sdrplay'" src="static/img/SDRplay-RSP2.jpg" alt="SDRPlay">
                </md-card-media>

                <md-card-area>
                  <md-card-header>
                    <div class="md-title">{{device.manufacturer}} {{device.productName}}</div>
                    <div class="md-subhead">{{device.serialNumber}}</div>
                  </md-card-header>

                  <md-card-actions>
                    <md-button @click="connect(device.serialNumber)">Connect</md-button>
                  </md-card-actions>
                </md-card-area>
              </md-card-media-cover>
            </md-card>
        </md-layout>
        <md-layout md-gutter></md-layout>
        <md-layout md-gutter></md-layout>
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
    connect: function (serialNumber) {
      Service.get('/devices/open/' + serialNumber).then(response => {
        this.$router.push({path: 'spectrum/' + serialNumber, params: {serialNumber: serialNumber}})
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
</style>