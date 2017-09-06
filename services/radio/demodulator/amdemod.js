const Demodulator = require('./demodulator');

class AMDemod extends Demodulator  {

	constructor(mode) {
		super();
	}

	demodulate(buffer) {
		let result = new Float32Array(buffer.length / 2);
		for (let i = 0; i < buffer.length; i+=2) {
			result[i/2] = Math.sqrt(buffer[i] * buffer[i] + buffer[i+1] * buffer[i + 1]);
		}
		return result; 
	}

}

module.exports = AMDemod;