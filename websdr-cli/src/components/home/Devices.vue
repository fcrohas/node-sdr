<template>
  <v-container fluid grid-list-md class="grey lighten-4">
    <v-layout wrap row v-for="(devices,index) in devicesByColumns(devices,2)" :key="index">
        <v-flex md3 v-for="(device,index) in devices" key="device.serialNumber">
          <v-card>
            <v-card-media class="white--text device-img" v-if="device.type=='rtlsdr'" height="200px" src="static/img/rtlsdrv3.jpg">
                <v-container fill-height fluid>
                  <v-layout fill-height>
                    <v-flex xs12 align-end flexbox>
                      <span class="headline white--text" v-text="device.deviceName"></span>
                    </v-flex>
                  </v-layout>
                </v-container>              
            </v-card-media>
            <v-card-media class="white--text" v-if="device.type=='sdrplay'" height="200px" src="static/img/SDRplay-RSP2.jpg">
                <v-container fill-height fluid>
                  <v-layout fill-height>
                    <v-flex xs12 align-end flexbox>
                      <span class="headline white--text" v-text="device.deviceName"></span>
                    </v-flex>
                  </v-layout>
                </v-container>              
            </v-card-media>
            <v-card-actions class="white">
              <v-spacer></v-spacer>
              <v-btn @click="connect(device.serialNumber)">Connect</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
    </v-layout>
    <v-snackbar :top="true" :left="false" :bottom="false" :right="false" v-model="errors.length" :timeout="5000" :multi-line="false" :vertical="false">
        <span>{{errors.join('.')}}</span>
        <v-button flat class="white--text" @click.native="clearErrors()">Retry</v-button>
    </v-snackbar>   
</v-container>
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
      errors: []
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
        this.errors = []
        this.errors.push(e.response.data)
        this.$refs.snackbar.open()
        Service.get('/devices/close/' + serialNumber).then(response => {
        })
      })
    },
    clearErrors: function () {
      this.errors = []
      this.$refs.snackbar.close()
    }
  },
  created () {
  }
}
</script>

<style lang="css" scoped>
</style>