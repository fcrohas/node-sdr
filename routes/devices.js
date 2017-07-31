var express = require('express');
var fs = require('fs');
var router = express.Router();
var devices = [];
var devicesManager = null;
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
  devices = devicesManager.getDevices();
  var response = { count : devices.length, devices : []};
  for (var i = 0; i < devices.length; i++) {
  	response.devices.push({deviceName : devices[i].name,
  				serialNumber : devices[i].serial});
  }
  res.send(response);
});

router.post('/save', function(req, res, next) {
	const devicesToSave = req.body.devices.map( serial => {
		return devices[serial];
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
		devices = devicesManager.getDevices();
	}
	// Only one by serial number
	if (devices[req.params.serialNumber] != null) {
		const device = devices[req.params.serialNumber];
		// Open then start
		device.open();
		// start here
		const deviceChannel = socketRouter.websocket.of('/socket/device/' + device[0].serialNumber);
		deviceChannel.on('connection', (socket) => {
			// Message listener
			socket.on('start', (message) => {
				console.log('start *** ' + message);
				device.start();
			});

			socket.on('stop', (message) => {
				console.log('stop *** ' + message);
				device.stop();
				socket.disconnect(0);
			});
			// disconnect listener
			socket.on('disconnect', function() {
				console.log('disconnect *** ');
				deviceChannel.close();
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
