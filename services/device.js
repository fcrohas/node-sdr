class Device {
	constructor() {
		this.centerFrequency = 106100000;
		this.sampleRate = 2048000;
		this.gain = 421;
	}

	open() {

	}

	close() {
		
	}

	setCenterFrequency(frequency) {
		this.centerFrequency = frequency;
	}

	getSampleRate() {
		return this.sampleRate;
	}
	
	setSampleRate(rate) {
		this.sampleRate = rate;
	}

	setGain(gain) {
		this.gain = gain;
	}

	start() {

	}

	stop() {

	}

	listen() {

	}

	getCapabilities() {
		return [];
	}
}

module.exports = Device;