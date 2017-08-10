var Device = require('../device');

class SDRPlayDevice extends Device {

	constructor(driver, sdrplaydevice)	{
		super();
		this.driver = driver;
		this.device = sdrplaydevice;
		this.streamCallback = null;
		this.ASYNC_BUF_SIZE = 32 * 512;
		this.ASYNC_BUF_NUMBER = 15;
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
		this.driver.StreamInit(58, this.sampleRate / 1000000, this.centerFrequency / 1000000,1536,0,2,28,0,128, (xi,xq,firstSampleNum,grChanged,rfChanged,fsChanged,numSamples, reset) => {
			if (this.streamCallback != null) {
				/* count1 is lesser of input samples and samples to end of buffer */
				/* count2 is the remainder, generally zero */
				var end = this.bufferOffset + (numSamples * 2);
				var count2 = end - (this.ASYNC_BUF_SIZE * this.ASYNC_BUF_NUMBER);
				if (count2 < 0) count2 = 0; /* count2 is samples wrapping around to start of buf */
				var count1 = (numSamples * 2) - count2; /* count1 is samples fitting before the end of buf */
				/* flag */
				var new_buf_flag = ((this.bufferOffset & (this.ASYNC_BUF_SIZE - 1)) < (end & (this.ASYNC_BUF_SIZE - 1))) ? 0 : 1;

				var input_index = 0;
				for (var i = 0; i < count1 >> 1; i++) {
					// Copy I low / high part
					this.bufferData[this.bufferOffset] = xi[input_index] & 0xff;
					this.bufferOffset++;
					this.bufferData[this.bufferOffset] = (xi[input_index] >> 8) & 0xff;
					// Copy Q low / high part
					this.bufferOffset++;
					this.bufferData[this.bufferOffset] = xq[input_index] & 0xff;
					this.bufferOffset++;
					this.bufferData[this.bufferOffset] = (xq[input_index] >> 8 ) & 0xff;
					this.bufferOffset++;
					input_index++;
				}

				if(this.bufferOffset >= this.ASYNC_BUF_SIZE * this.ASYNC_BUF_NUMBER) {
					this.bufferOffset = 0;
				}

				// remaining data
				for (var i = 0; i < count2 >> 1; i++) {
					// Copy I low / high part
					this.bufferData[this.bufferOffset] = xi[input_index] & 0xff;
					this.bufferOffset++;
					this.bufferData[this.bufferOffset] = (xi[input_index] >> 8) & 0xff;
					// Copy Q low / high part
					this.bufferOffset++;
					this.bufferData[this.bufferOffset] = xq[input_index] & 0xff;
					this.bufferOffset++;
					this.bufferData[this.bufferOffset] = (xq[input_index] >> 8 ) & 0xff;
					this.bufferOffset++;
					input_index++;
				}				
				// merge I/Q buffer
				if (new_buf_flag) {
					end = this.bufferOffset + this.ASYNC_BUF_SIZE * (this.ASYNC_BUF_NUMBER - 1);
					end &= this.ASYNC_BUF_SIZE * this.ASYNC_BUF_NUMBER - 1;
					end &= ~(this.ASYNC_BUF_SIZE - 1);					
					this.streamCallback(this.bufferData.slice(end, this.ASYNC_BUF_SIZE));
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