const Demodulator = require('./demodulator');

class AMDemod extends Demodulator  {

	constructor(mode) {
		super();
	}

	demodulate(buffer) {
		super.demodulate(buffer);
		// to work
		for (let i = 0; i < buffer.length; i+=2) {
			this.result[i/2] = Math.sqrt(buffer[i] * buffer[i] + buffer[i+1] * buffer[i + 1]);
		}
		return this.dc_block_filter(this.result); 
	}

}

module.exports = AMDemod;