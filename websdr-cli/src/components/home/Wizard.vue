<template>
  <v-container fluid>
      <v-layout wrap column justify-center>
        <v-flex offset-md4 md4>
          <v-stepper v-model="stepperValue">
            <v-stepper-header>
              <v-stepper-step step="1" :complete="stepperValue > 1">Plug</v-stepper-step>
              <v-divider></v-divider>
              <v-stepper-step step="2" :complete="stepperValue > 2">Select</v-stepper-step>
              <v-divider></v-divider>
              <v-stepper-step step="3">Save</v-stepper-step>
            </v-stepper-header>
            <v-stepper-content step="1">
                <v-btn primary @click="getDeviceList()" >Continue</v-btn>
            </v-stepper-content>
            <v-stepper-content step="2">
                <v-list v-if="stepperValue==2" three-line>
                    <template>
                        <v-list-tile avatar v-for="(device, key) in devices" @click="device.selected=!device.selected" :key="device.serialNumber">
                          <v-list-tile-avatar>
                            <v-icon>usb</v-icon>
                          </v-list-tile-avatar>
                          <v-list-tile-content>
                            <v-list-tile-title>{{device.deviceName}} - {{device.productName}}</v-list-tile-title>
                            <v-list-tile-sub-title>{{device.manufacturer}}</v-list-tile-sub-title>
                          </v-list-tile-content>
                          <v-list-tile-action>
                            <v-icon v-if="device.selected">check_circle</v-icon>
                          </v-list-tile-action>
                        </v-list-tile>
                    </template>
                </v-list>
                <v-btn primary @click="stepperValue = 3" >Continue</v-btn>
                <v-btn primary @click="stepperValue = 1" >Cancel</v-btn>
            </v-stepper-content>
            <v-stepper-content step="3">
                <v-btn primary @click="onSave()" >Save</v-btn>
            </v-stepper-content>
          </v-stepper>
            <v-snackbar :top="true" :left="false" :bottom="false" :right="false" v-model="errors.length" :timeout="5000" :multi-line="false" :vertical="false">
                <span>{{errors.join('.')}}</span>
                <v-button flat class="white--text" @click.native="clearErrors()">Retry</v-button>
            </v-snackbar>           
        </v-flex>
      </v-layout>
  </v-container>
</template>

<script>
import Service from '../../service/api'

export default {

  name: 'Wizard',
  props: {
  },
  data () {
    return {
      stepperValue: 1,
      devices: [],
      errors: [],
      devicesDetected: false
    }
  },
  methods: {
    getDeviceList: function () {
      Service.get('/devices/list').then(response => {
        // Add view propertiesvalign
        this.devices = response.data.devices.map(device => {
          device.selected = false
          device.inUse = false
          return device
        })
        if (this.devices.length > 0) {
          this.stepperValue += 1
        }
      }).catch(e => {
        this.errors.push(e)
        this.devicesDetected = false
        this.stepperValue = 1
      })
    },
    onSave: function () {
      this.errors = []
      const devicesSerial = this.devices.map(device => {
        return device.serialNumber
      })
      Service.post('/devices/save', {
        devices: devicesSerial
      }).then(response => {
        this.$emit('completed')
      }).catch(e => {
        this.errors.push(e)
        this.$refs.snackbar.open()
      })
    },
    clearErrors: function () {
      this.errors = []
      this.$refs.snackbar.close()
    }
  },
  computed: {
    isSelected: function () {
      return this.devices.filter(device => {
        if (device.selected) {
          return device
        }
      }).length > 0
    }
  }
}
</script>

<style lang="css" scoped>
.spacing {
  padding: 10px;
}
.green {
	color: green;
}
p.text {
    line-height: 40px;
}
.valign {
	vertical-align: middle;
}
</style>