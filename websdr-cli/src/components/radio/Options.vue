<template>
      <v-container fluid grid-list-sm class="full-size">
        <v-layout row wrap class="scrollbox">
          <v-flex xs12 v-for="(item,index) in capabilities" :key="item.name">
                <v-flex xs6>{{item.name}}</v-flex>
                <v-flex xs6>
                    <v-select v-if="item.type==='choice'"
                      v-bind:items="item.values"
                      v-model="item.value"
                      label="Select"
                      single-line
                      auto
                      prepend-icon="map"
                      @change="changeSetting(item, $event)"
                      hide-details
                    ></v-select>
                    <vue-slider v-if="item.type==='range'" v-model="item.value"
                        :min="item.min" :max="item.max" :interval="item.interval" 
                        :width="'auto'" :tooltip="'hover'" tooltip-dir="'right'" @callback="changeSetting(item, $event)" :lazy="true"></vue-slider>
                </v-flex>
            </v-flex>
        </v-layout>
    </v-container>
 </template>

<script>
import vueSlider from 'vue-slider-component'
import { mapGetters, mapActions } from 'vuex'
export default {

  name: 'Options',
  components: { vueSlider },
  computed: {
    ...mapGetters({
      capabilities: 'capabilities',
      isConnected: 'isConnected'
    })
  },
  methods: {
    ...mapActions({
      getCapabilities: 'getCapabilities',
      writeSetting: 'writeSetting'
    }),
    changeSetting (item, input) {
      item.value = input
      this.writeSetting(item)
    }
  },
  watch: {
    // On connect retrieve capabilities for additional settings
    isConnected () {
      this.getCapabilities()
    }
  },
  data () {
    return {
      serialNumber: ''
    }
  },
  mounted () {
    if (this.$route.params != null) {
      this.serialNumber = this.$route.params.serialNumber
    }
  }
}
</script>

<style lang="css" scoped>
.full-size {
  width: 100%;
  height: 100%;
}
.scrollbox {
  width: 100%;
  height: 500px;
  overflow: auto;

}
</style>