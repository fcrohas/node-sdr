<template>
  <v-container fluid>
    <v-layout column>
      <v-flex xs12 align-end flexbox>
        <h4>Tuner frequency : {{centerFrequency}} <v-btn @click="changeCenterFrequency(10000)">+</v-btn> / <v-btn @click="changeCenterFrequency(-10000)">-</v-btn></h4>
      </v-flex>
      <v-flex xs12 align-end flexbox>
        <h4>Frequency : {{tunedFrequency}}</h4>
      </v-flex>
      <v-flex xs12 align-end flexbox>
        <h4>Bandwidth : {{currentBandwidth}}</h4>
      </v-flex>
      <v-flex xs12 align-end flexbox v-for="capability in capabilities" :key="capability.name">
        <p>{{capability.name}} -> {{capability.values}}</p>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {

  name: 'Control',
  props: {
  },
  computed: mapGetters({
    tunedFrequency: 'tunedFrequency',
    currentBandwidth: 'currentBandwidth',
    centerFrequency: 'centerFrequency',
    capabilities: 'capabilities'
  }),
  methods: mapActions({
    changeCenterFrequency: 'changeCenterFrequency',
    getCapabilities: 'getCapabilities'
  }),
  data () {
    return {
    }
  },
  mounted () {
    this.getCapabilities()
  }
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
}
</style>