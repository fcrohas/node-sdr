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

	setSampleRate(rate) {
		this.sampleRate = rate;
	}

	setGain(gain) {
		this.gain = gain;
	}

}

module.exports = Device;