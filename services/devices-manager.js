class DevicesManager {

	constructor() {
	  this.rtlsdr = null;
	  this.sdrplay = null;
	  this.devices = [];
	}

	loadDrivers() {
	  // Try to load sdrjs driver
	  try {
	    this.rtlsdr = require('sdrjs');
	  } catch(e) {
            console.log('Unable to load rtlsdr driver.');
	  }
	  // try to load sdrplay driver
	  try {
	    this.sdrplay = require('node-sdrplay');
	  } catch(e) {
            console.log('Unable to load sdrplay driver.');
	  }
	}

	getDevices() {
		// reset
		this.devices = [];
		// devices type rtlsdr
		if (this.rtlsdr != null) {
		  const rtldevices = rtlsdr.getDevices();
		  for (var i = 0; i < rtldevices.length; i++) {
	   	    var device = rtldevices[i];
	            this.devices[device.serialNumber] = { 
			    type : 'rtlsdr', 
			    device : device, 
			    name : device.manufacturer + ' ' + device.productName + ' ' +device.deviceName,
			    serial : device.serialNumber
		    }
		  }

		}
		// device type sdrplay
		if (this.sdrplay != null) {
		  const sdrplaydevices = sdrplay.GetDevices(4);
		  for ( var i = 0; i < sdrplaydevices.length; i++) {
		    var device = sdrplaydevices[i];
		    this.devices[device.SerNo] = {
			    type : 'sdrplay',
			    device : device,
			    name : device.hwVer,
			    serial : device.SerNo
		    }
		  }
		}
		return this.devices;
	}

	getDevice(serial) {
	 	return this.devices[serial];
	}
}

module.exports = new DevicesManager();
