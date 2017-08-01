var Device = require('../device');

class DummyDevice extends Device {

	constructor(driver, rtldevice)	{
		super();
		this.driver = driver;
		this.device = rtldevice;
	}

	static getDriverName() {
		return 'dummy';
	}

	static getDevices() {
	  var devices = [];
	  devices['XXXXXXXXXX01'] = new DummyDevice(null, null);
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
			var buffer = new Int16Array(1024);
			for (var i=0; i< buffer.length; i++) {
				buffer[i] = Math.random() * 255;
			}
			callback(buffer);
		},100);
	}
}

module.exports= DummyDevice;