Device = require('../device');

class DummyDevice extends Device {

	constructor(driver, rtldevice)	{
		super();
		this.driver = driver;
		this.device = rtldevice;
		this.centerFrequency = 105000000;
		this.sampleRate = 2048000;
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
	}

	stop() {
		console.log('Device listener thread stopped.');
	}

	listen(callback) {
		setInterval( () => {
			// Generate 
			var buffer = new Int16Array(32768);
			for (var i=0; i< buffer.length; i++) {
				buffer[i] = Math.random() * 15 - 1; // white noise
				buffer[i] += Math.sin(i / ( 5 / (Math.PI*2))) * 140; // sinusoide
				buffer[i] += Math.cos(i / (1.5 / (Math.PI*2))) * 150; // sinusoide
				buffer[i+1] = 0;
			}
			callback(buffer);
		},50);
	}
}

module.exports= DummyDevice;