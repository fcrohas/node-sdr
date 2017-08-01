var Device = require('../device');

class RTLSDRDevice extends Device {

	constructor(driver, rtldevice)	{
		super();
		this.driver = driver;
		this.device = rtldevice;
	}

	static getDriverName() {
		return 'sdrjs';
	}

	static getDevices() {
	  var driver = require('sdrjs');
	  var devices = [];
	  const rtldevices = driver.getDevices();
	  for (var i = 0; i < rtldevices.length; i++) {
        devices[rtldevices[i].serialNumber] = new RTLSDRDevice(driver, rtldevices[i]);
	  }
	  return devices;
	}

	getType() {
		return 'rtlsdr';
	}

	getName() {
		return this.device.manufacturer + ' ' + this.device.productName + ' ' + this.device.deviceName;
	}

	getSerial() {
		return this.device.serialNumber;
	}

	getDevice() {
		return this.device;		
	}

	open() {
		this.device.open();
	}

	close() {
		this.device.close();
	}

	start() {
		this.device.start();
	}

	stop() {
		this.device.stop();
	}
}

module.exports= RTLSDRDevice;