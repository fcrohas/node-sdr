const Demodulator = require('./demodulator');

class SSBDemod extends Demodulator  {
	constructor(mode, opts) {
		super(opts.samplerate);
		this.mode = 0; // USB;
		switch(mode) {
			case 'USB': this.mode = 0; break;
			case 'LSB': this.mode = 1; break;
			default: this.mode = 0;
		}
	}

	demodulate(buffer) {
		super.demodulate(buffer);
		
		for (let i = 0; i < buffer.length; i+=2) {
			if (this.mode) {
				this.result[i/2] = buffer[i] + buffer[i+1] * 0.95;
			} else {
				this.result[i/2] = buffer[i] - buffer[i+1] * 0.95;
			}
		}
		return this.result;
	}

}

module.exports = SSBDemod;