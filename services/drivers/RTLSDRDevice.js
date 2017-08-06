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
        console.log('Added device with serial ' + rtldevices[i].serialNumber);
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
		this.device.tunerGain = this.gain;
		this.device.centerFrequency = this.centerFrequency;
		this.device.sampleRate = this.sampleRate;
		this.device.start();
	}

	stop() {
		this.device.stop();
	}

	listen(callback) {
		this.device.on('data', e => {
			// Int8Array to int16array
			// send it
			callback(new Int16Array(e.buffer));
		});
	}
}

module.exports= RTLSDRDevice;