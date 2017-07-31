class DevicesManager {

	constructor() {
	  this.rtlsdr = null;
	  this.sdrplay = null;
	  this.devices = [];
	  this.driver_holder = [];
	}

	loadDrivers() {
		var fs = require('fs');
		var path_module = require('path');
		var path = path_module.join(__dirname, 'drivers');
		console.log('Loading drivers from ' + path + ' ...');
        var files = fs.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
        	console.log('Loading drivers ' + files[i] + ' ...');	  
            var f = path_module.join(path, files[i]);
	        this.driver_holder.push(require(f));
        }
        // 
	    console.log(files.length + ' driver(s) loaded.');
	}

	getDevices() {
		// reset
		this.devices = {};
		// devices type rtlsdr
		if (this.driver_holder.length > 0 ) {
			for (var i=0; i< this.driver_holder.length; i++) {
				var driver = this.driver_holder[i];
				var devicesDriver = null;
				try {
					devicesDriver = driver.getDevices();
					console.log('Found ' + Object.keys(devicesDriver).length + ' device(s) with NodeJS driver ' + driver.getDriverName());
					// Merge with previous driver result
					Object.assign(this.devices, devicesDriver);
				} catch(e) {
					console.log("Unable to load " + driver.getDriverName() + " NodeJS driver. Error : " + e);
				}
			}
		}
		return this.devices;
	}

	getDevice(serial) {
	 	return this.devices[serial];
	}
}

module.exports = new DevicesManager();
