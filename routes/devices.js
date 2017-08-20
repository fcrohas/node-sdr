var express = require('express');
var fs = require('fs');
var router = express.Router();
var devices = [];
var deviceChannels = [];
var node_config = process.env.NODE_ENV || 'development';
var config = require('config-node')();
var IQProcessor = require('../services/iqprocessor');
var FFT_SIZE = 4096;
var iqprocessor = new IQProcessor(FFT_SIZE);

/* Wrapper object */
var socketRouter = { 
	router: router, 
	websocket: null,
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
					device.listen((data) => {
						// Initialize one buffer feedback
						var fftArray = new Float32Array(data.length);
						var fftSize = 0;
						var offset = 0;
						// Chunk for fft
						for (var i = 0; i < data.length; i += FFT_SIZE * 2) {
							// fft size is 512 so double buffer
							var truncData = data.subarray(i, i + FFT_SIZE * 2);
							// call fft
							var fftdata = iqprocessor.doProcess(truncData);
							fftArray.set(fftdata, offset * fftdata.length);
							fftSize += fftdata.length;
							offset++;
						}
						// emit data
						fftSize = fftSize / 4; // 32 bits -> 8 bits
						var arr8 = new Int8Array(fftSize / 4);
						for (var i=0; i < fftSize / 4; i++) {
							arr8[i] = Math.round(fftArray[i]);
						}
						// invert FFTSIZE / 2
						var halfup = arr8.subarray(FFT_SIZE / 2);
						var datareverse = new Int8Array(fftSize);
						datareverse.set(halfup);
						datareverse.set(arr8.subarray(0, FFT_SIZE / 2), FFT_SIZE / 2);

						socket.emit('fft',Buffer.from(datareverse.buffer));
					});
				});
				//
				socket.on('config', (messages, callback) => {
					// Multiple command ?
					let result = null;
					for (let i = 0; i < messages.length; i++) {
						switch(messages[i].type) {
							case 'samplerate' : device.setSampleRate(messages[i].value); break;
							case 'centerfrequency' : device.setCenterFrequency(messages[i].value); break;
							case 'tunergain' : device.setGain(messages[i].value); break;
							case 'capabilities' : result = device.getCapabilities(); break;
						}
					}
					callback(result);
				});
				// Stop devic streaming
				socket.on('stop', (message, callback) => {
					console.log(socket.id + ' stop ***' + message + '***');
					device.stop();
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
		res.status(200).send();
	} else {
		res.status(500).send('Unable to close device with serial : '+req.params.serialNumber);	
	}
});

module.exports = socketRouter;
