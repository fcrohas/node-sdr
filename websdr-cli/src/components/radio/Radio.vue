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
            <audio-stream class="full-size"></audio-stream>
        </v-flex>
    </v-layout>


<!--    <vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="1600" :h="400" :x="100" :y="500">
        <waterfall></waterfall>
    </vue-draggable-resizable>
    <vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="800" :h="200" :x="100" :y="100">
        <control></control>
    </vue-draggable-resizable>
    <vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="400" :h="200" :x="800" :y="200">
        <audio-stream></audio-stream>
    </vue-draggable-resizable>
 -->   </v-container>
  
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
  })
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
}
</style>