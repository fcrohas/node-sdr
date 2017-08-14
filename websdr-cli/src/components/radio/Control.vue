<template>
  <md-card md-with-hover class="full-size">
    <md-card-header>
        <md-card-header-text>
          <div class="md-title">Radio</div>
          <div class="md-subhead">Type</div>
        </md-card-header-text>

        <md-menu md-size="4" md-direction="bottom left">
          <md-button class="md-icon-button" md-menu-trigger>
            <md-icon>more_vert</md-icon>
          </md-button>

          <md-menu-content>
            <md-menu-item>
              <span>Move</span>
              <md-icon>zoom_out_map</md-icon>
            </md-menu-item>
          </md-menu-content>
        </md-menu>
      </md-card-header>        
    <md-card-media>
        <p>Tuner frequency : {{centerFrequency}} <button @click="changeCenterFrequency(10000)">+</button> / <button @click="changeCenterFrequency(-10000)">-</button></p>
        <p>Frequency : {{tunedFrequency}}</p>
        <p>Bandwidth : {{currentBandwidth}}</p>
    </md-card-media>

    <md-card-actions>
      <md-button class="md-icon-button">
        <md-icon>play</md-icon>
      </md-button>
    </md-card-actions>
  </md-card>      
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
    centerFrequency: 'centerFrequency'
  }),
  methods: mapActions({
    changeCenterFrequency: 'changeCenterFrequency'
  }),
  data () {
    return {
    }
  }
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
}
</style>