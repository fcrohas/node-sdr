const Device = require('./device');

class DummyDevice extends Device {

	constructor(driver, dummydevice)	{
		super();
		this.driver = driver;
		this.device = dummydevice;
		this.threads = require('threads');
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
		this.spawn = this.threads.spawn;
		this.thread = this.spawn((input, done, progress) => {

			this.fs = require('fs');
			this.wavreader = require('node-wav');
			this.sleep = require('thread-sleep');
			let buffer = this.fs.readFileSync('./data/FM_HD_IQ.wav');
			let result = this.wavreader.decode(buffer);	
			console.log('Reading wav file at rate='+result.sampleRate+' length='+result.channelData[0].length);			
			let interleavedArr = new Float32Array(result.channelData[0].length * 2);			
			// Prepare interleave data
			let c = 0;
			const chunkIQ = 16 * 16384;
			const chunkIQ2 = 8 * 16384;
			for (let i = 0; i < result.channelData[0].length; i += chunkIQ2) {
				const chunkI = result.channelData[0].subarray(i, i + chunkIQ2);
				const chunkQ = result.channelData[1].subarray(i, i + chunkIQ2);
				for (let j = 0; j < chunkIQ2; j++) {
					interleavedArr[c] = chunkI[j];
					interleavedArr[c + 1] = chunkQ[j];
					c+=2;
				}
			}
			let i = 0;
			// Rouding length
			const newlength = Math.round( interleavedArr.length / chunkIQ) * chunkIQ;
			while(1) {
				if (i + chunkIQ <= newlength) {
					progress({data: interleavedArr.subarray(i, i + chunkIQ), length: chunkIQ});					
					i += chunkIQ;
				} else {
					i = 0;
				}
				this.sleep(64);
			}

			console.log('End of streaming...');			
		});		
	}

	stop() {
		console.log('Device listener thread stopped.');
		if (this.thread != null) {
			this.thread.kill();
		}
	}

	listen(callback) {
		this.thread
		.send()
		.on('progress', (progress) => {
			const floatarr = new Float32Array(progress.length);
			for(let i = 0; i < progress.length; i++) {
				floatarr[i] = progress.data[i];
			}
			callback(floatarr);
		}).on('done', () => {
			console.log('done streaming...');
		});		
	}
}

module.exports= DummyDevice;