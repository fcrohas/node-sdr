<template>
  <v-container fluid grid-list-md>
   <vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="800" :h="400" :x="500" :y="500">
        <waterfall></waterfall>
    </vue-draggable-resizable>
    <vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="400" :h="300" :x="100" :y="100">
        <control></control>
    </vue-draggable-resizable>
    <vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="400" :h="200" :x="800" :y="200">
        <audio-stream></audio-stream>
    </vue-draggable-resizable>
   </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Waterfall from './Waterfall'
import Control from './Control'
import AudioStream from './Audio'

export default {
  name: 'Radio',
  components: { Waterfall, Control, AudioStream },
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
    lorem: `Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.`
  })
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
}
</style>