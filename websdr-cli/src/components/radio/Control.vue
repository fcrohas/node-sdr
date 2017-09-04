<template>
  <v-card class="elevation-0 full-size">
    <v-card-text class="full-size">
      <v-container fluid class="full-size">
        <v-layout class="display full-size">
          <v-flex xs12 class="full-size">
            <span class="frequency">{{tunedFrequency}}<span class="tunerFrequency">Tuner frequency : {{centerFrequency}}</span></span>
          </v-flex>
          <v-flex xs12 class="full-size">
            <p>Modulation</p>
            <v-btn v-model="modulation">
                <v-btn flat value="am">AM</v-btn>
                <v-btn flat value="fm">FM</v-btn>
                <v-btn flat value="wfm">WFM</v-btn>
                <v-btn flat value="usb">USB</v-btn>
                <v-btn flat value="lsb">LSB</v-btn>
            </v-btn>
          </v-flex>
          <v-flex>
            <v-btn icon @click="stop()">
              <v-icon>exit_to_app</v-icon>
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Service from '../../service/api'

export default {

  name: 'Control',
  props: {
  },
  computed: {
    ...mapGetters({
      tunedFrequency: 'tunedFrequency',
      currentBandwidth: 'currentBandwidth',
      centerFrequency: 'centerFrequency',
      capabilities: 'capabilities'
    })
  },
  methods: {
    ...mapActions({
      changeCenterFrequency: 'changeCenterFrequency',
      getCapabilities: 'getCapabilities',
      disconnect: 'disconnect'
    }),
    stop: function () {
      // Close websocket
      this.disconnect()
      // close device
      Service.get('/devices/close/' + this.serialNumber).then(response => {
        this.$router.push({path: '/'})
      })
      this.disconnected = true
    }
  },
  data () {
    return {
      modulation: 'fm',
      disconnected: false,
      serialNumber: ''
    }
  },
  mounted () {
    if (this.$route.params != null) {
      this.serialNumber = this.$route.params.serialNumber
      this.getCapabilities()
    }
  }
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
  padding: 0px;
}
.frequency {
    color: black;
    font-size: 54px;
    font-weight: 2;
    border: 2px solid lightgray;
}
.tunerFrequency {
    position: absolute;
    top: 88px;
    left: 30px;
    font-size: 8px;
    color: lightgray;
}
</style>