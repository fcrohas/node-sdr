var Device = require('../device');

class SDRPlayDevice extends Device {

	constructor(driver, sdrplaydevice)	{
		super();
		this.driver = driver;
		this.device = sdrplaydevice;
	}

	static getDriverName() {
		return 'node-sdrplay';
	}

	static getDevices(driver) {
	  var driver = require('node-sdrplay');
	  var devices = [];
	  const sdrplaydevices = driver.GetDevices(4);
	  for ( var i = 0; i < sdrplaydevices.length; i++) {
	    devices[sdrplaydevices[i].SerNo] = new SDRPlayDevice(driver, sdrplaydevices[i]);
	  }
	  return devices;
	}

	getType() {
		return 'sdrplay';
	}

	getName() {
		return 'SDRPlay RSP'+this.device.hwVer;
	}

	getSerial() {
		return this.device.SerNo;
	}

	getDevice() {
		return this.device;		
	}

	open() {
		this.driver.SetDeviceIdx(this.device.DevNm);
	}

	close() {
		this.driver.ReleaseDeviceIdx();
	}

	start() {
		//this.device.start();
	}

	stop() {
		//this.device.stop();
	}	
}

module.exports = SDRPlayDevice;