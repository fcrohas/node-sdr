var Device = require('./device');

class SDRPlayDevice extends Device {

	constructor(driver, sdrplaydevice)	{
		super();
		this.driver = driver;
		this.device = sdrplaydevice;
		this.streamCallback = null;
		this.ASYNC_BUF_SIZE = 8 * 2000;
		this.ASYNC_BUF_NUMBER = 24;
		this.bufferData = new Int16Array(this.ASYNC_BUF_NUMBER * this.ASYNC_BUF_SIZE);
		this.bufferOffset = 0;
		this.started = false;
	}

	static getDriverName() {
		return 'node-sdrplay';
	}

	static getDevices(driver) {
	  var driver = require('node-sdrplay');
	  var devices = [];
	  const sdrplaydevices = driver.GetDevices(4);
	  for ( var i = 0; i < sdrplaydevices.length; i++) {
	    sdrplaydevices[i].idx = i;
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
		this.driver.SetDeviceIdx(this.device.idx);
		console.log("Device "+this.device.idx+" opened.");		
	}

	close() {
		this.driver.ReleaseDeviceIdx();
		console.log("Device closed.");		
	}

	start() {
		this.driver.RSPII_AntennaControl(1);
		this.driver.AmPortSelect(0);
		this.driver.RSPII_RfNotchEnable(0);
		this.driver.RSPII_BiasTControl(1);
		if (this.sampleRate < 2000000) {
			this.driver.DecimateControl(1, 8, 0);
			this.sampleRate = this.sampleRate * 8;
		} else {
			//this.driver.DecimateControl(1, 2, 0);
		}
		this.driver.StreamInit(48, this.sampleRate / 1000000, this.centerFrequency / 1000000, 1536, 0, 3, 28, 0, 128, (iqbuffer,bufferSize,firstSampleNum,grChanged,rfChanged,fsChanged,numSamples, reset) => {
			this.started = true;
			if (this.streamCallback != null) {
				this.streamCallback(new Int16Array(iqbuffer.buffer));
			}
		}, function(gRdB, lnagRdB) {
			console.log("gRdb="+gRdB+" lnagRdB="+lnagRdB);
		}, 64*16384, 16);
	}

	stop() {
		this.driver.StreamUninit();
		this.started = false;
	}	

	listen(callback) {
		this.streamCallback = callback;
	}

	setCenterFrequency(value) {
		super.setCenterFrequency(value);
		if (this.started) {
			this.driver.SetRf(this.centerFrequency, 1, 0);
		}
	}

	getCapabilities() {
		return [
		{
			type: 'range',
			name: 'gainReduction',
			values: '0-59',
			default: 58
		},
		{
			type: 'range',
			name: 'sampleRate',
			values: '2000000-10000000',
			default: 2048000
		},
		{
			type: 'range',
			name: 'frequency',
			values: this.tuningRange

		},
		{
			type: 'choice',
			name: 'antenna',
			values: ['Port A', 'Port B', 'HI-Z']
		},
		{
			type: 'choice',
			name: 'filter',
			values: this.device.Bw_MHzT
		}];
	}

}

module.exports = SDRPlayDevice;