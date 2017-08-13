var Device = require('../device');

class SDRPlayDevice extends Device {

	constructor(driver, sdrplaydevice)	{
		super();
		this.driver = driver;
		this.device = sdrplaydevice;
		this.streamCallback = null;
		this.ASYNC_BUF_SIZE = 32 * 512;
		this.ASYNC_BUF_NUMBER = 16;
		this.bufferData = new Int16Array(this.ASYNC_BUF_NUMBER * this.ASYNC_BUF_SIZE);
		this.bufferOffset = 0;
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
	    console.log('Added device with serial ' + sdrplaydevices[i].SerNo);
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
		this.driver.RSPII_AntennaControl(1);
		this.driver.RSPII_BiasTControl(1);
		this.driver.StreamInit(58, this.sampleRate / 1000000, this.centerFrequency / 1000000,1536,0,2,28,0,128, (xibuffer,xqbuffer,firstSampleNum,grChanged,rfChanged,fsChanged,numSamples, reset) => {
			if (this.streamCallback != null) {
				// Convert arraybuffedr to int16array as it is short
				const xi = new Int16Array(xibuffer.buffer);
				const xq = new Int16Array(xqbuffer.buffer);
				// New buffer end 
				var end = this.bufferOffset + (numSamples * 2);
				var count2 = end - (this.ASYNC_BUF_SIZE * this.ASYNC_BUF_NUMBER); // sample after end of buffer
				if (count2 < 0) count2 = 0; // not at the end of buffer 
				var count1 = (numSamples * 2) - count2;  // place sample next to offset
				/* flag */
				//var new_buf_flag = ((this.bufferOffset & (this.ASYNC_BUF_SIZE - 1)) < (end & (this.ASYNC_BUF_SIZE - 1))) ? 0 : 1;
				var new_buf_flag = (count2 > 0) ? 1 : 0;

				var input_index = 0;
				// Interleave at buffer offset
				for (var i = 0; i < count1 / 2; i++) {
					// Copy I low / high part
					this.bufferData[this.bufferOffset] = xi[input_index];
					this.bufferOffset++;
					// Copy Q low / high part
					this.bufferData[this.bufferOffset] = xq[input_index];
					this.bufferOffset++;
					input_index++;
				}

				// merge I/Q buffer
				if (new_buf_flag) {
					// end = this.bufferOffset + this.ASYNC_BUF_SIZE * (this.ASYNC_BUF_NUMBER - 1);
					// end &= this.ASYNC_BUF_SIZE * this.ASYNC_BUF_NUMBER - 1;
					// end &= ~(this.ASYNC_BUF_SIZE - 1);					
					//var arr = this.bufferData.slice(end, this.ASYNC_BUF_SIZE);
					// callback
					this.streamCallback(this.bufferData);
				}

				if(this.bufferOffset >= this.ASYNC_BUF_SIZE * this.ASYNC_BUF_NUMBER) {
					this.bufferOffset = 0;
				}

				// remaining data
				for (var i = 0; i < count2 / 2; i++) {
					// Copy I low / high part
					this.bufferData[this.bufferOffset] = xi[input_index];
					this.bufferOffset++;
					// Copy Q low / high part
					this.bufferData[this.bufferOffset] = xq[input_index];
					this.bufferOffset++;
					input_index++;
				}				
			}
		}, function(gRdB, lnagRdB) {
			console.log("gRdb="+gRdB+" lnagRdB="+lnagRdB);
		});
	}

	stop() {
		this.driver.StreamUninit();
	}	

	listen(callback) {
		this.streamCallback = callback;
	}
}

module.exports = SDRPlayDevice;