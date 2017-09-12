<template>
  <v-container fluid grid-list-md class="full-size">
    <v-layout row wrap class="full-size">
        <v-flex xs12 md2 class="full-size">
            <control class="full-size"></control>
        </v-flex>
        <v-flex xs12 md8 class="full-size">
            <waterfall class="full-size"></waterfall>
        </v-flex>
        <v-flex xs12 md2 class="full-size">
            <audio-stream></audio-stream>
            <options></options>            
        </v-flex>
    </v-layout>
  </v-container>
  
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Waterfall from './Waterfall'
import Control from './Control'
import AudioStream from './Audio'
import Options from './Options'

export default {
  name: 'Radio',
  components: { Waterfall, Control, AudioStream, Options },
  computed: mapGetters({
    tunedFrequency: 'tunedFrequency',
    currentBandwidth: 'currentBandwidth',
    centerFrequency: 'centerFrequency'
  }),
  methods: mapActions({
    changeCenterFrequency: 'changeCenterFrequency',
    connect: 'connect'
  }),
  mounted: function () {
    // Connect to socket serial number
    this.connect(this.$route.params.serialNumber)
  },
  data: () => ({
  })
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
/*  height: 100%;*/
}
</style>