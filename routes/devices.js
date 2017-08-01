var express = require('express');
var fs = require('fs');
var router = express.Router();
var devices = [];
var node_config = process.env.NODE_ENV || 'development';
var config = require('config-node')();

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
		// start here
		const deviceChannel = socketRouter.websocket.of('/socket/device/' + device.getSerial());
		deviceChannel.on('connection', (socket) => {
			// Message listener
			socket.on('start', (message) => {
				console.log('start *** ' + message);
				device.start();
				device.listen(function(data) {
					socket.emit('fft',data);
				});
			});

			socket.on('stop', (message) => {
				console.log('stop *** ' + message);
				device.stop();
				if (message == 'disconnect') {
					console.log('disconnect client connection');
					socket.disconnect(0);	
				}
				
			});

			// disconnect listener
			socket.on('disconnect', function() {
				console.log('disconnect *** ');
				socket.disconnect(0);	
			});
		});
	}
	res.status(200).send();
});

router.get('/close/:serialNumber', function(req, res, next) {
	if (devices[req.params.serialNumber] != null) {
		const device = devices[req.params.serialNumber];
		// Only one by serial number
		device.close();
		res.status(200).send();
	}
});

module.exports = socketRouter;
