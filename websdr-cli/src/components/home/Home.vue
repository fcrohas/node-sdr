<template>
    <div>
    	<wizard v-if="displayWizard" v-on:completed="displayWizard=false"></wizard>
        <devices v-if="!displayWizard" :devices="devices"></devices>
    </div>
</template>

<script>
import Wizard from './Wizard'
import Devices from './Devices'
import Service from '../../service/api'

export default {
  name: 'Home',
  components: { Wizard, Devices },
  props: {
    wizard: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      devices: [],
      displayWizard: false
    }
  },
  mounted () {
    Service.get('/devices/config').then(response => {
        // Add view propertiesvalign
      this.devices = response.data
      this.displayWizard = false
    }).catch(e => {
      this.displayWizard = true
    })
  }
}
</script>

<style lang="css" scoped>
</style>