<template>
      <v-container fluid grid-list-sm class="full-size">
        <v-layout row wrap class="scrollbox">
            <v-flex xs12 v-for="(item,index) in capabilities" :key="item.name">
                    <v-radio-group v-if="item.type==='radio'" :input-value="item.value" dark>
                        <v-radio v-for="option in item.values" :label="option" :value="option" :key="option" @change="changeSetting(item, $event)">
                        </v-radio>
                    </v-radio-group>
                    <v-switch dark v-if="item.type==='switch'" :label="item.name" :input-value="item.value" @change="changeSetting(item, $event)">
                    </v-switch>
                    <div v-if="item.type==='choice'">
                        <p>{{item.name}}</p>
                        <v-select dark
                          v-bind:items="item.values"
                          v-model="item.value"
                          :label="item.name"
                          single-line
                          auto
                          prepend-icon="map"
                          @change="changeSetting(item, $event)"
                          hide-details
                        ></v-select>
                    </div>
                    <span v-if="item.type==='range'">
                        <p>{{item.name}}</p>
                        <vue-slider dark v-model="item.value"
                            :min="item.min" :max="item.max" :interval="item.interval" 
                            :width="'auto'" :tooltip="'hover'" tooltip-dir="'right'" @callback="changeSetting(item, $event)" :lazy="true"></vue-slider>
                    </span>
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
  color:white;
  width: 100%;
  background:black;
}
.scrollbox {
  width: 100%;
  height: 500px;
  overflow: auto;

}
.inline {
    float:left;
    display: inline;
}
</style>