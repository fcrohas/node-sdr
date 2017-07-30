var express = require('express');
var rtlsdr = require('sdrjs');
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
	onSocketRegistered : null
};

/* GET users listing. */
router.get('/list', function(req, res, next) {
  const rtldevices = rtlsdr.getDevices();
  var response = { count : rtldevices.length, devices : []};
  for (var i = 0; i < rtldevices.length; i++) {
  	devices.push(rtldevices[i]);
  	response.devices.push({deviceName : rtldevices[i].deviceName, 
  							productName : rtldevices[i].productName,
  							manufacturer : rtldevices[i].manufacturer,
  							serialNumber : rtldevices[i].serialNumber});
  }
  res.send(response);
});

router.post('/save', function(req, res, next) {
	const devicesSerial = req.body.devices.join(',');
	const devicesToSave = devices.map(device => {
		if (devicesSerial.indexOf(device.serialNumber) != -1) {
			return {type: 'rtlsdr',
					deviceName : device.deviceName, 
  					productName : device.productName,
  					manufacturer : device.manufacturer,
  					serialNumber : device.serialNumber};
		}
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
		devices = rtlsdr.getDevices();
	}
	const device = devices.filter(device => {
		if (device.serialNumber == req.params.serialNumber) {
			return device;
		}
	});
	// Only one by serial number
	if (device.length == 1) {
		device[0].open();
		const deviceChannel = socketRouter.websocket.of('/socket/device/' + device[0].serialNumber);
		deviceChannel.on('connection', (socket) => {
			device[0].start();
			// Message listener
			socket.on('message', (message) => {
				console.log('received *** ' + message);
			});
			// disconnect listener
			socket.on('disconnect', function() {
				device[0].stop();
			});
		});
	}
	res.status(200).send();
});

router.get('/close/:serialNumber', function(req, res, next) {
	const device = devices.filter(device => {
		if (device.serialNumber == req.params.serialNumber) {
			return device;
		}
	});
	// Only one by serial number
	if (device.length == 1) {
		device[0].close();
	}
	res.status(200).send();
});

module.exports = socketRouter;