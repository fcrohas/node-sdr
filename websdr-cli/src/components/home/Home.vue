<template>
    <div>
      <wizard v-if="devices.length==0" v-on:completed="wizardCompleted()"></wizard>
      <devices v-if="devices.length>0" :devices="devices"></devices>
    </div>
</template>

<script>
import Wizard from './Wizard'
import Devices from './Devices'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Home',
  components: { Wizard, Devices },
  props: {
    wizard: {
      type: Boolean,
      default: false
    }
  },
  computed: mapGetters({
    devices: 'allDevices'
  }),
  data () {
    return {
      displayWizard: false
    }
  },
  methods: {
    ...mapActions({
      getAllDevices: 'getAllDevices'
    }),
    wizardCompleted: function () {
      this.getAllDevices()
    }
  },
  created () {
    this.getAllDevices()
  }
}
</script>

<style lang="css" scoped>
</style>