<template>
  <md-layout class="spacing">
    <md-layout md-hide-medium></md-layout>
    <md-layout>
    	<md-stepper md-alternate-labels @completed="onSave()">
    	  <md-step md-label="Plugin device" md-icon="usb" :md-continue="devicesDetected">
    	  <md-layout md-align="center" md-gutter="16">
      		<md-layout md-flex="35">
    		    <p class="text"><span>Plug your device then press detect.</span>
    		    <md-button class="valign md-raised" @click="getDeviceList()">DETECT</md-button>
    		    </p>
      		</md-layout>
      	  </md-layout>
    	  </md-step>
    	  <md-step md-label="Select" :md-continue="isSelected">
    		  <md-layout md-align="center" md-gutter="40">
    	  		<md-layout md-flex="35">
    			    <p>Please select devices you want to use.</p>
    			</md-layout>
    		  </md-layout>
    		  <md-layout md-align="center" md-gutter="40">
    	  		<md-layout md-flex="35">
    			    <md-list>
    				    <md-list-item v-for="(device, key) in devices" @click="device.selected=!device.selected" key="device.serialNumber">
    				    	<md-icon>usb</md-icon> <span>{{device.serialNumber}} - {{device.manufacturer}} {{device.deviceName}} {{device.productName}}</span><md-icon class="green" v-if="device.selected">check_circle</md-icon>
    				    </md-list-item>
    			    </md-list>
    			</md-layout>
    		  </md-layout>
    	  </md-step>
    	  <md-step md-label="Save" :md-editable="true">
    	    <p>This seems something important I need to fix just right before the last step.</p>
    	  </md-step>
    	</md-stepper>
        <md-snackbar :md-position="'top center'" ref="snackbar" :md-duration="5000">
            <span>{{errors.join('.')}}</span>
            <md-button class="md-accent" md-theme="light-blue" @click="clearErrors()">Retry</md-button>
        </md-snackbar>    
      </md-layout>
      <md-layout md-hide-medium></md-layout>
    </md-layout>
</template>

<script>
import Service from '../../service/api'

export default {

  name: 'Wizard',
  props: {
  },
  data () {
    return {
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
        this.devicesDetected = this.devices.length > 0
      }).catch(e => {
        this.errors.push(e)
        this.devicesDetected = false
        this.$refs.snackbar.open()
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