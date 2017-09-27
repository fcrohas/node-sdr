const Demodulator = require('./demodulator');

class AMDemod extends Demodulator  {

	constructor(mode) {
		super();
	}

	demodulate(buffer) {
		super.demodulate(buffer);
		// to work
		let sigSum = 0;
		for (let i = 0; i < buffer.length; i+=2) {
			const amplitude = Math.sqrt(buffer[i] * buffer[i] + buffer[i+1] * buffer[i + 1]) * 0.95;
			this.result[i/2] = amplitude;
			sigSum += amplitude;
		}
		const halfPoint = sigSum / this.result.length;
		for (let i = 0; i < this.result.length; i++) {
			this.result[i] = (this.result[i] - halfPoint) / halfPoint;
		}
		return this.result; 
	}

}

module.exports = AMDemod;