class Device {
	constructor() {
		this.centerFrequency = 105500000;
		this.frequency = 106100000;
		this.sampleRate = 2048000;
		this.gain = 421;
	}

	static getDriverName() {
		return 'interface';
	}

	static getDevices() {
		return [];
	}

	open() {

	}

	close() {
		
	}

	setFrequency(frequency) {
		this.frequency = frequency;
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

	writeSetting(name, value) {

	}
}

module.exports = Device;