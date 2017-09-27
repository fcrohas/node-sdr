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
		this.LNAState = 2;
		this.gRdBsystem = 28;
		this.DCenable = 0;
		this.IQenable = 0;
		this.AGCenable = 0;
		this.GrMode = this.driver.SetGrModeT.mir_sdr_USE_RSP_SET_GR;
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
		this.driver.DCoffsetIQimbalanceControl(1, 1);	
		let decimate = 1;
		if (this.sampleRate / 1000000 < 2.0) {
			// Activate decimation
			while (this.sampleRate * decimate / 1000000 < 2.0) decimate *= 2;
			if (decimate > 32) decimate = 32;
			// activate decimation
			console.log('Activate decimation '+decimate);
			this.driver.DecimateControl(1, decimate, 0);
		} else {
			this.driver.DecimateControl(0, 2, 0);
		}

		//this.driver.SetDcMode(5,0);
		console.log('start streamInit for sampleRate ', this.sampleRate, 'with recalculated ', this.sampleRate * decimate);
		this.driver.StreamInit(this.gainReduction, 
				this.sampleRate * decimate / 1000000, 
				this.centerFrequency / 1000000, 
				this.driver.Bw_MHzT.mir_sdr_BW_1_536, 
				this.driver.If_kHzT.mir_sdr_IF_Zero, 
				this.LNAState, 
				this.gRdBsystem, 
				this.GrMode, 
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
				console.log('Reinit error', errorcode);
			}
		}
	}

	setGain(value) {
		super.setGain(value);
		if (this.started) {
			this.writeSetting('gainReduction', value);
		}
	}

	getCapabilities() {
		return [
		{ type: 'range', category: 'gain', name: 'gainReduction', min: 20, max: 59, interval: 1, value: 58 },
		{ type: 'range', category: 'gain', name: 'lnaState', min: 0, max: 8, interval: 1, value: 3 },
		{ type: 'choice', category: 'frequency', name: 'sampleRate', values: [192000, 384000, 768000, 1536000, 3072000, 6000000, 7000000, 8000000], default: 2048000 },
		{ type: 'range', category: 'frequency', name: 'frequency', values: this.tuningRange },
		{ type: 'radio', category: 'RSP2', name: 'antenna', values: ['Port A', 'Port B', 'HI-Z'], value: 'Port A' },
		{ type: 'choice', category: 'frequency', name: 'filter', values: [this.driver.Bw_MHzT.mir_sdr_BW_0_200, 
												   this.driver.Bw_MHzT.mir_sdr_BW_0_300, 
												   this.driver.Bw_MHzT.mir_sdr_BW_0_600, 
												   this.driver.Bw_MHzT.mir_sdr_BW_1_536, 
												   this.driver.Bw_MHzT.mir_sdr_BW_5_000,
												   this.driver.Bw_MHzT.mir_sdr_BW_6_000,
												   this.driver.Bw_MHzT.mir_sdr_BW_7_000,
												   this.driver.Bw_MHzT.mir_sdr_BW_8_000], value: this.driver.Bw_MHzT.mir_sdr_BW_1_536 },
		{ type: 'choice', category: 'frequency', name: 'localMode', values: [this.driver.LoModeT.mir_sdr_LO_Undefined,
													  this.driver.LoModeT.mir_sdr_LO_Auto,
													  this.driver.LoModeT.mir_sdr_LO_120MHz,
													  this.driver.LoModeT.mir_sdr_LO_144MHz,
													  this.driver.LoModeT.mir_sdr_LO_168MHz], value: this.driver.LoModeT.mir_sdr_LO_Auto },
		{ type: 'choice', category: 'frequency', name: 'ifMode', values: [this.driver.If_kHzT.mir_sdr_IF_Zero,
												   this.driver.If_kHzT.mir_sdr_IF_0_450,
												   this.driver.If_kHzT.mir_sdr_IF_1_620,
												   this.driver.If_kHzT.mir_sdr_IF_2_048], value: this.driver.If_kHzT.mir_sdr_IF_Zero},
		{ type: 'switch', category: 'RSP2', name: 'biast', values: [0, 1], value: 0},
		{ type: 'switch', category: 'RSP2', name: 'notch', values: [0, 1], value: 0},
		{ type: 'switch', category: 'RSP2', name: 'dcoffset', values: [0, 1], value: 0},
		{ type: 'switch', category: 'RSP2', name: 'iqimbalance', values: [0, 1], value: 0},
		{ type: 'choice', category: 'gain', name: 'agccontrol', values: [this.driver.AgcControlT.mir_sdr_AGC_DISABLE, 
												this.driver.AgcControlT.mir_sdr_AGC_100HZ, 
												this.driver.AgcControlT.mir_sdr_AGC_50HZ, 
												this.driver.AgcControlT.mir_sdr_AGC_5HZ], value: this.driver.AgcControlT.mir_sdr_AGC_DISABLE}];
	}

	writeSetting(name, value) {
		let errorcode = 0;
		console.log('setting '+name+' value='+value);
		switch(name) {
			case 'ifMode':
				errorcode = this.driver.ReInit(0, 0, 0, 0, value, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_IF_TYPE);
				break;
			case 'localMode':
				errorcode = this.driver.ReInit(0, 0, 0, 0, 0, value, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_LO_MODE);
				break;
			case 'gainReduction':
				this.gainReduction = value;
				errorcode = this.driver.ReInit(this.gainReduction, 0, 0, 0, 0, 0, this.LNAState, this.gRdBsystem, this.GrMode, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_GR);
				// try {
				// 	this.driver.RSP_SetGr(this.gainReduction, this.LNAState, 1, 0);
				// } catch(e) {
				// 	console.log("Unable to set gain. Error:"+e);
				// }
				break;
			case 'lnaState':
				this.LNAState = value;
				errorcode = this.driver.ReInit(this.gainReduction, 0, 0, 0, 0, 0, this.LNAState, this.gRdBsystem, this.GrMode, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_GR);
				// try{
				// 	this.driver.RSP_SetGr(this.gainReduction, this.LNAState, 1, 0);
				// } catch(e) {
				// 	console.log("Unable to set gain. Error:"+e);
				// }
				break;
			case 'sampleRate':
				let decimate = 1;
				if (value / 1000000 < 2.0) {
					// Activate decimation
					while (value * decimate / 1000000 < 2.0) decimate *= 2;
					if (decimate > 32) decimate = 32;
					// activate decimation
					console.log('Activate decimation reinit '+decimate);
					this.driver.DecimateControl(1, decimate, 0);
				} else {
					this.driver.DecimateControl(0, 2, 0);
				}
				// reinit only if value are   different
				if (value != this.sampleRate) {
					errorcode = this.driver.ReInit(0, value * decimate / 1000000, 0, 0, 0, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_FS_FREQ);
				}
				break;
			case 'antenna':
				switch(value) {
					case 'Port A': 
						this.driver.AmPortSelect(0);
						this.driver.RSPII_AntennaControl(this.driver.RSPII_AntennaSelectT.mir_sdr_RSPII_ANTENNA_A);
						break;
					case 'Port B':
						this.driver.AmPortSelect(0);
						this.driver.RSPII_AntennaControl(this.driver.RSPII_AntennaSelectT.mir_sdr_RSPII_ANTENNA_B);
						break;
					case 'HI-Z': 
						// Select AM port then reinit
						this.driver.AmPortSelect(1);
						errorcode = this.driver.ReInit(this.gainReduction, 0, 0, 0, 0, 0, this.LNAState, this.gRdBsystem, this.GrMode, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_AM_PORT);
						break;
					default:
				}
				break;
			case 'filter':
				errorcode = this.driver.ReInit(0, 0, 0, value, 0, 0, 0, 0, 0, 0, this.driver.ReasonForReinitT.mir_sdr_CHANGE_BW_TYPE);
				break;
			case 'biast':
				this.driver.RSPII_BiasTControl(value);
				break;
			case 'notch':
				this.driver.RSPII_RfNotchEnable(value);
				break;
			case 'dcoffset':
				this.DCenable = value;
				this.driver.DCoffsetIQimbalanceControl(this.DCenable, this.IQenable);
			case 'iqimbalance':
				this.IQenable = value;
				this.driver.DCoffsetIQimbalanceControl(this.DCenable, this.IQenable);
				break;
			case 'agccontrol':
				this.driver.AgcControl(value, -30.0, 0, 0, 0, 0, this.LNAState);
			default:

		}

		if (errorcode != 0) {
			console.log('Reinit error for command', name, ' with value ', value, ' error=',errorcode);
		}
	}

}

module.exports = SDRPlayDevice;