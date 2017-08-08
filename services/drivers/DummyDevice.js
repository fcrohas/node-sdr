Device = require('../device');

class DummyDevice extends Device {

	constructor(driver, rtldevice)	{
		super();
		this.driver = driver;
		this.device = rtldevice;
		this.centerFrequency = 105000000;
		this.sampleRate = 2048000;
		this.listening = false;
		this.fs = require('fs');
	}

	static getDriverName() {
		return 'dummy';
	}

	static getDevices() {
	  var devices = [];
	  devices['XXXXXXXXXX01'] = new DummyDevice(null, null);
	  console.log('Added device with serial XXXXXXXXXX01');
	  return devices;
	}

	getType() {
		return 'rtlsdr';
	}

	getName() {
		return 'Dummy RTLSDR RT802';
	}

	getSerial() {
		return 'XXXXXXXXXX01';
	}

	getDevice() {
		return this.device;		
	}

	open() {
		console.log('Device opened.');
	}

	close() {
		console.log('Device closed.');
	}

	start() {
		console.log('Device listener thread started.');
		this.listening = true;
	}

	stop() {
		console.log('Device listener thread stopped.');
		this.listening = false;
	}

	listen(callback) {
		var readStream = this.fs.createReadStream('./data/SDRSharp_20150804_204423Z_0Hz_IQ.wav');
		readStream.on('data', (chunk) => {
			if (this.listening) {
		  		callback(new Int16Array(chunk));
			}
		});
	}
}

module.exports= DummyDevice;