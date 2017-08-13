Device = require('../device');

class DummyDevice extends Device {

	constructor(driver, rtldevice)	{
		super();
		this.driver = driver;
		this.device = rtldevice;
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
		this.thread = this.spawn(function() {});
	}

	stop() {
		console.log('Device listener thread stopped.');
		if (this.thread != null) {
			this.thread.kill();
		}
	}

	listen(callback) {
		this.thread.run((input, done, progress) => {
			this.fs = require('fs');
			this.wavreader = require('node-wav');
			while(1) {
				let buffer = this.fs.readFileSync('./data/SDRSharp_20150804_204423Z_0Hz_IQ.wav');
				let result = this.wavreader.decode(buffer);	
				let interleavedArr = new Float32Array(262144);
				console.log('Reading wav file at rate='+result.sampleRate+' length='+result.channelData[0].length);
				for(let i = 0; i < result.channelData[0].length; i += 131072) {
					// interleave data
					const chunkI = result.channelData[1].subarray(i, i + 131072);
					const chunkQ = result.channelData[0].subarray(i, i + 131072);
					let c=0;
					for (let j = 0; j < 262144; j+=2) {
						interleavedArr[j] = chunkI[c++];
						interleavedArr[j + 1] = chunkQ[c++];
						c++;
					}
					progress({data :interleavedArr, length:interleavedArr.length});
					var waitTill = new Date(new Date().getTime() + 100);
					while(waitTill > new Date()){}
				}
				console.log('Loop again ...');
			}
			console.log('End of streaming...');			
			done();
		})
		.send()
		.on('progress', (progress) => {
			console.log('Progress....');
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