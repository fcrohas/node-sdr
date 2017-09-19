const express = require('express');
const fs = require('fs');
const router = express.Router();
let devices = [];
let deviceChannels = [];
const node_config = process.env.NODE_ENV || 'development';
const config = require('config-node')();
const ADPCM = require('../services/radio/codecs/adpcm');
const IQProcessor = require('../services/iqprocessor');
const Audio = require('../services/radio/audio/audio');
const FFT_SIZE = 4096;
const iqprocessor = new IQProcessor(FFT_SIZE);
const adpcm = new ADPCM();

/* Wrapper object */
const socketRouter = { 
	router: router, 
	websocket: null,
	audio: new Audio(),
	setWebsocket : function(socket) {
		this.websocket = socket;
		if (this.onSocketRegistered != null) {
			this.onSocketRegistered(socket);
		}
		
	},
	setDevicesManager : function(devicesManager) {
		this.devicesManager = devicesManager;
	},
	onSocketRegistered : null
};

/* GET users listing. */
router.get('/list', function(req, res, next) {
  devices = socketRouter.devicesManager.getDevices();
  var serials = Object.keys(devices);
  var response = { count : serials.length, devices : []};
  for (var i = 0; i < serials.length; i++) {
  	var serial = serials[i];
  	response.devices.push({ deviceName : devices[serial].getName(),
  						    serialNumber : devices[serial].getSerial()});
  }
  res.send(response);
});

router.post('/save', function(req, res, next) {
	const devicesToSave = req.body.devices.map( serial => {
		return { deviceName : devices[serial].getName(), serialNumber : devices[serial].getSerial(), type : devices[serial].getType()}; 
	});
	fs.writeFile('config/'+node_config+'.json', JSON.stringify(devicesToSave), function (err) {
	  if (err) return res.status(500).send(err);
	  res.status(200).send();
	});
	// reload config
	config = require('config-node')();
});

router.get('/config', function(req, res, next) {
	res.json(JSON.parse(fs.readFileSync('config/'+node_config+'.json', 'utf8')));
});

router.get('/open/:serialNumber', function(req, res, next) {
	if (devices.length == 0) {
		devices = socketRouter.devicesManager.getDevices();
	}
	// Only one by serial number
	if (devices[req.params.serialNumber] != null) {
		const device = devices[req.params.serialNumber];
		// Open then start
		device.open();
		// create websocket room if needed
		if (deviceChannels['/socket/device/' + device.getSerial()] == null) {
			console.log('Create initial room for device '+device.getSerial());
			deviceChannels['/socket/device/' + device.getSerial()] = socketRouter.websocket.of('/socket/device/' + device.getSerial());
			deviceChannels['/socket/device/' + device.getSerial()].on('connection', (socket) => {
				// start device streaming
				socket.on('start', (message) => {
					console.log(socket.id + ' start *** ' + message);
					device.start();
					// On audio buffer complete
					socketRouter.audio.on('complete', (compressed) => {
						if (compressed!=null) {
							socket.emit('pcm',compressed);
						}
					});
					const stateenc = {predicted_value: 0, v_step_index: 0};
					const statedec = {predicted_value: 0, v_step_index: 0};
					device.listen((data) => {
						let floatarr = iqprocessor.convertToFloat(data);						
						// Process FFT
						var fftOut = iqprocessor.doFFT(floatarr);
						if (fftOut != null) {
							// fftOut to Int16Array cast using buffer
							const int16Array = new Int16Array(fftOut.buffer);
							// prepare output after compression will be resized after
							const out8Array = new Uint8Array(int16Array.length / 2);
							// prepare state
							const state = { predicted_value:0 , step_index:0 };
							// Encode
							const length = adpcm.adpcm_ima_encode(out8Array, int16Array, int16Array.length, state);
							//console.log('16 bit array length='+int16Array.length,'Uint8array length='+fftOut.length,'compress length=',out8Array.length, 'computed length=',length);
							socket.emit('fft',Buffer.from(out8Array.buffer));
						}
						// Demodulate signal
						if (iqprocessor.canDemodulate()) {
							var pcmOut = iqprocessor.doDemodulate(floatarr);
							if (pcmOut != null) {
								socketRouter.audio.encode(pcmOut);
							}
						}
					});
				});
				//
				socket.on('config', (messages, callback) => {
					// Multiple command ?
					let result = null;
					for (let i = 0; i < messages.length; i++) {
						switch(messages[i].type) {
							case 'samplerate' : 
								device.setSampleRate(messages[i].value);
								iqprocessor.setSampleRate(messages[i].value);
								break;
							case 'centerfrequency' : 
								device.setCenterFrequency(messages[i].value); 
								iqprocessor.setCenterFrequency(messages[i].value); 
								break;
							case 'tunergain' : 
								device.setGain(messages[i].value); 
								break;
							case 'capabilities' : 
								result = device.getCapabilities();
								break;
							case 'modulation' : 
								iqprocessor.setModulation(messages[i].value); 
								socketRouter.audio.setSamplerate(iqprocessor.getAudiorate());
								break;
							case 'bandwidth' : 
								iqprocessor.setBandwidth(messages[i].value); 
								break;
							case 'frequency' : 
								device.setFrequency(messages[i].value); 
								iqprocessor.setFrequency(messages[i].value); 
								break;
							case 'setting' :
								device.writeSetting(messages[i].value.name, messages[i].value.value);
						}
					}
					if (callback) {
						callback(result);
					}
				});
				// Stop devic streaming
				socket.on('stop', (message, callback) => {
					console.log(socket.id + ' stop ***' + message + '***');
					device.stop();
					socketRouter.audio.off('complete');
					if (message == 'disconnect') {
						callback(); // Use call back to confirm disconnect
						console.log('disconnect client session from server')
						socket.disconnect(0);
					}
					
				});

				// disconnect listener
				socket.on('disconnect', (reason) => {
					console.log(socket.id + ' disconnect *** ' + reason);
					socket.removeAllListeners();
				});
			});
		}
		res.status(200).send();
	} else {
		res.status(500).send('Unable to open device with serial : '+req.params.serialNumber);
	}
});

router.get('/close/:serialNumber', function(req, res, next) {
	if (devices[req.params.serialNumber] != null) {
		const device = devices[req.params.serialNumber];
		// Only one by serial number
		device.close();
		// refresj devices
		devices = socketRouter.devicesManager.getDevices();
		res.status(200).send();
	} else {
		res.status(500).send('Unable to close device with serial : '+req.params.serialNumber);	
	}
});

module.exports = socketRouter;
