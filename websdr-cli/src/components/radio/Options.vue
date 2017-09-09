<template>
<v-expansion-panel expand>
    <v-expansion-panel-content v-for="(item,i) in capabilities" :key="i">
      <div slot="header">{{item.name}}</div>
      <v-card>
        <v-card-text class="grey lighten-3">
			<v-container fluid>
		        <v-layout row wrap>
		          <v-flex xs12>
		            <v-select v-if="item.type==='choice'"
		              v-bind:items="item.values"
		              v-model="item.value"
		              label="Select"
		              single-line
		              auto
		              prepend-icon="map"
                      @change="writeSetting(item)"
		              hide-details
		            ></v-select>
		          </v-flex>
		        </v-layout>
			</v-container>        	
        </v-card-text>
      </v-card>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {

  name: 'Options',
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
    })
  },
  watch: {
    // On connect retrieve capabilities for additional settings
    isConnected (value) {
      if (!value) {
        return
      }
      this.getCapabilities()
    }
  },
  data () {
    return {
      value: 200,
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
</style>