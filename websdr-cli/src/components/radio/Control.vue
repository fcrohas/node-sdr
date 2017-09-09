<template>
  <v-card class="elevation-0 full-size">
    <v-card-text class="full-size">
      <v-container fluid class="full-size">
        <v-layout row wrap class="display full-size">
          <v-flex xs12 class="full-size">
            <span class="frequency">{{tunedFrequency}}<span class="tunerFrequency">Tuner frequency : {{centerFrequency}}</span></span>
            <v-btn flat value="am" @click="changeCenterFrequency(-500000)">-</v-btn>
            <v-btn flat value="am" @click="changeCenterFrequency(500000)">+</v-btn>
          </v-flex>
          <v-flex xs12 class="full-size">
            <v-btn flat value="am" @click="changeModulation('AM')">AM</v-btn>
            <v-btn flat value="fm" @click="changeModulation('FM')">FM</v-btn>
            <v-btn flat value="wfm" @click="changeModulation('WFM')">WFM</v-btn>
            <v-btn flat value="usb" @click="changeModulation('USB')">USB</v-btn>
            <v-btn flat value="lsb" @click="changeModulation('LSB')">LSB</v-btn>
          </v-flex>
          <v-flex xs12 class="full-size">
            <v-btn flat value="500" @click="changeFrequencyStep(500)">500 Hz</v-btn>
            <v-btn flat value="1000" @click="changeFrequencyStep(1000)">1 Khz</v-btn>
            <v-btn flat value="5000" @click="changeFrequencyStep(5000)">5 Khz</v-btn>
            <v-btn flat value="12500" @click="changeFrequencyStep(12500)">12.5 Khz</v-btn>
            <v-btn flat value="50000" @click="changeFrequencyStep(50000)">50 Khz</v-btn>
          </v-flex>
          <v-flex xs12 class="full-size">
            RF
            <vue-slider v-model="gain.value" 
                              :min="gain.min" :max="gain.max" :interval="1" :width="'auto'"
                              :tooltip="'hover'" tooltip-dir="'right'" @callback="changeTunerGain" :lazy="true"></vue-slider>          
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
import vueSlider from 'vue-slider-component'
import { mapGetters, mapActions } from 'vuex'
import Service from '../../service/api'

export default {

  name: 'Control',
  components: { vueSlider },
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
      changeModulation: 'changeModulation',
      changeTunerGain: 'changeTunerGain',
      changeFrequencyStep: 'changeFrequencyStep',
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
      serialNumber: '',
      gain: {
        value: 58,
        min: 0,
        max: 59
      }
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
    top: 60px;
    left: 10px;
    font-size: 8px;
    color: lightgray;
}
</style>