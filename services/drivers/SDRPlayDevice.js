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
		this.gainReduction = 48;
		this.LNAState = 3;
		this.gRdBsystem = 28;
	}

	static getDriverName() {
		return 'node-sdrplay';
	}

	static getDevices(driver) {
	  var driver = require('sdrplay-bindings');
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

	setSampleRate(rate) {
		super.setSampleRate(rate);
		this.writeSetting('sampleRate', rate);
	}

	start() {
		this.driver.RSPII_AntennaControl(this.driver.mir_sdr_RSPII_ANTENNA_B);
		this.driver.AmPortSelect(0);
		this.driver.RSPII_RfNotchEnable(0);
		this.driver.RSPII_BiasTControl(1);
		if (this.sampleRate < 2000000) {
			this.driver.DecimateControl(1, 8, 0);
			this.sampleRate = this.sampleRate * 8;
		} else {
			//this.driver.DecimateControl(1, 2, 0);
		}
		this.driver.StreamInit(this.gainReduction, 
				this.sampleRate / 1000000, 
				this.centerFrequency / 1000000, 
				this.driver.Bw_MHzT.mir_sdr_BW_1_536, 
				this.driver.If_kHzT.mir_sdr_IF_Zero, 
				this.LNAState, 
				this.gRdBsystem, 
				this.driver.SetGrModeT.mir_sdr_USE_RSP_SET_GR, 
				128, 
				(iqbuffer,bufferSize,firstSampleNum,grChanged,rfChanged,fsChanged,numSamples, reset) => {
					this.started = true;
					if (this.streamCallback != null) {
						this.streamCallback(new Int16Array(iqbuffer.buffer));
					}
				}, 
				(gRdB, lnagRdB) => {
					console.log("gRdb="+gRdB+" lnagRdB="+lnagRdB);
				}, 
				32*16384, // Buffer size
				16 ); // Buffer count
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
			let errorcode = this.driver.ReInit(0, 0, value / 1000000, 0, 0, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_RF_FREQ);
			if (errorcode != 0) {
				console.log('Reini error', errorcode);
			}
		}
	}

	getCapabilities() {
		return [
		{ type: 'range', name: 'gainReduction', values: '0-59', default: 58 },
		{ type: 'range', name: 'sampleRate', values: '2000000-10000000', default: 2048000 },
		{ type: 'range', name: 'frequency', values: this.tuningRange },
		{ type: 'choice', name: 'antenna', values: ['Port A', 'Port B', 'HI-Z'] },
		{ type: 'choice', name: 'filter', values: this.device.Bw_MHzT },
		{ type: 'choice', name: 'localMode', values: ['Undefined', 'Auto', '120Mhz', '144Mhz', '164Mhz'] },
		{ type: 'choice', name: 'ifMode', values: [0, 450, 1620, 2048]}];
	}

	writeSetting(name, value) {
		let errorcode = 0;
		switch(name) {
			case 'ifMode':
				errorcode = this.driver.ReInit(0, 0, 0, 0, value, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_IF_TYPE);
				break;
			case 'localMode':
				errorcode = this.driver.ReInit(0, 0, 0, 0, 0, value, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_LO_MODE);
				break;
			case 'gainReduction':
				errorcode = this.driver.ReInit(this.gainReduction, 0, 0, 0, 0, 0, this.LNAState, this.gRdBsystem, this.GrMode, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_GR);
				break;
			case 'sampleRate':
				errorcode = this.driver.ReInit(0, value / 1000000, 0, 0, 0, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_FS_FREQ);
				break;
			case 'antenna':
				switch(value) {
					case 'Port A': 
						this.driver.AmPortSelect(0);
						this.driver.RSPII_AntennaControl(this.driver.mir_sdr_RSPII_ANTENNA_A);
						break;
					case 'Port B':
						this.driver.AmPortSelect(0);
						this.driver.RSPII_AntennaControl(this.driver.mir_sdr_RSPII_ANTENNA_B);
						break;
					case 'HI-Z': 
						// Select AM port then reinit
						this.driver.AmPortSelect(1);
						errorcode = this.driver.ReInit(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_AM_PORT);
						break;
					default:
				}
				break;
			case 'filter':
				errorcode = this.driver.ReInit(0, 0, 0, value, 0, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_BW_TYPE);
				break;
			default:
		}

		if (errorcode != 0) {
			console.log('Reini error', errorcode);
		}
	}

}

module.exports = SDRPlayDevice;