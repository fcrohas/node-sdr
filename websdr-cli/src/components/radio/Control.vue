<template>
  <v-card class="elevation-0 full-size">
    <v-card-text class="full-size">
      <v-container fluid class="full-size">
        <v-layout row wrap class="display full-size">
          <v-flex xs12 class="tuner-group full-size">
              <div class="tuner-group">
                <span class="frequency">{{tunedFrequency | frequency}}</span>
              </div>
              <p class="text-xs-center">Center frequency</p>
              <v-btn class="tuner-btn" flat small @click="changeCenterFrequency(-500000)">-</v-btn>
              <v-btn class="tuner-btn" flat small @click="changeCenterFrequency(500000)">+</v-btn>
          </v-flex>
          <v-flex xs12 class="full-size tuner-group">
            <p>Modulation</p>
            <v-btn-toggle mandatory dark :input-value="modulationType" @change="changeModulation">
                <v-btn class="tuner-btn" flat small value="AM">AM</v-btn>
                <v-btn class="tuner-btn" flat small value="FM">FM</v-btn>
                <v-btn class="tuner-btn" flat small value="WFM">WFM</v-btn>
                <v-btn class="tuner-btn" flat small value="USB">USB</v-btn>
                <v-btn class="tuner-btn" flat small value="LSB">LSB</v-btn>
            </v-btn-toggle>
          </v-flex>
          <v-flex xs12 class="full-size tuner-group">
            <p>Frequency step</p>
            <v-btn-toggle mandatory dark :input-value="stepFrequency" @change="changeFrequencyStep">
                <v-btn class="tuner-btn" flat small value="500">500</v-btn>
                <v-btn class="tuner-btn" flat small value="1000">1 K</v-btn>
                <v-btn class="tuner-btn" flat small value="5000">5 K</v-btn>
                <v-btn class="tuner-btn" flat small value="12500">12.5 K</v-btn>
                <v-btn class="tuner-btn" flat small value="50000">50 K</v-btn>
            </v-btn-toggle>
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
  computed: {
    ...mapGetters({
      tunedFrequency: 'tunedFrequency',
      currentBandwidth: 'currentBandwidth',
      centerFrequency: 'centerFrequency',
      capabilities: 'capabilities',
      modulationType: 'modulationType',
      stepFrequency: 'stepFrequency'
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
  filters: {
    frequency: function (value) {
      console.log(value)
      return value.toString().replace(/(.{3})(?=.)/g, '$1.')
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
@font-face{
 font-family:'digital-clock-font';
 src: url('/static/fonts/digital-7 (mono).ttf');
}
.full-size {
  width: 100%;
  height: 100%;
  padding: 0px;
  background: black;
  color:white;
}
.frequency {
    font-family: 'digital-clock-font';
    color: white;
    font-size: 48px;
    font-weight: 0.5;
}
.tunerFrequency {
    position: absolute;
    top: 60px;
    left: 10px;
    font-size: 8px;
    color: lightgray;
}
.tuner-btn {
  color: white;
  width: 50px;
}
.tuner-group {
  border: white 1px solid;
}

</style>