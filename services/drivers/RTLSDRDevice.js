var Device = require('./device');

class RTLSDRDevice extends Device {

	constructor(driver, rtldevice)	{
		super();
		this.driver = driver;
		this.device = rtldevice;
		this.tuningRange = '0-0';
		this.streaming = false;
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
		this.device.frequencyCoorection = 52;
		// Update tunning range using tuner type
		switch(this.device.tunerType) {
			case 'R828D': this.tuningRange = '24000000-1766000000'; break;
			case 'R820T': this.tuningRange = '24000000-1766000000'; break;
			case 'FC2580': this.tuningRange = '149000000-924000000'; break;
			case 'FC0013': this.tuningRange = '22000000-1100000000'; break;
			case 'FC0012': this.tuningRange = '22000000-948600000'; break;
			case 'E4000': this.tuningRange = '52000000-2200000000'; break;
			default: this.tuningRange = '0-0'; break;
		}
	}

	close() {
		this.device.close();
	}

	start() {
		this.device.start();
		this.streaming = true;
	}

	stop() {
		this.device.stop();
		this.streaming = false;
	}

	listen(callback) {
		this.device.on('data', e => {
			// Int8Array to int16array
			// send it
			callback(new Int8Array(e.buffer));
		});
	}

	setSampleRate(sampleRate) {
		super.setSampleRate(sampleRate);
		this.device.sampleRate = sampleRate;
	}

	setCenterFrequency(frequency) {
		super.setCenterFrequency(frequency);
		this.device.centerFrequency = frequency;
	}

	setGain(gain) {
		super.setGain(gain);
		this.device.tunerGain = gain;
	}

	getCapabilities() {
		return [
		{
			type: 'list',
			name: 'tunerGain',
			values: this.device.validGains,
			default: 241
		},
		{
			type: 'range',
			name: 'sampleRate',
			values: '900001-3200000',
			default: 2048000
		},
		{
			type: 'range',
			name: 'frequency',
			values: this.tuningRange

		}];
	}
}

module.exports= RTLSDRDevice;