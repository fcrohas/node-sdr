const Device = require('./device');

class DummyDevice extends Device {

	constructor(driver, dummydevice)	{
		super();
		this.driver = driver;
		this.device = dummydevice;
		this.childprocess = require('child_process');
		this.reader = null;
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
		this.reader = this.childprocess.fork('./services/radio/audio/wavereader.js');
	}

	stop() {
		console.log('Device listener thread stopped.');
		if (this.reader != null) {
			this.reader.kill('SIGINT');
		}
	}

	listen(callback) {
		if (this.reader != null) {
			this.reader.on('message', (event) => {
				const floatarr = new Float32Array(event.length);
				for(let i = 0; i < event.length; i++) {
					floatarr[i] = event.data[i];
				}
				callback(floatarr);
			});
		}
	}
}

module.exports= DummyDevice;