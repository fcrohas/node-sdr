class SSBDemod {
	constructore(mode) {
		this.mode = 0; // USB;
		switch(mode) {
			case 'USB': this.mode = 0; break;
			case 'LSB': this.mode = 1; break;
			default: this.mode = 0;
		}
	}

	demodulate(buffer) {
		let result = new Float32Array(buffer.length / 2);
		for (let i = 0; i < buffer.length; i+=2) {
			if (this.mode) {
				result[i/2] = buffer[i] + buffer[i+1];
			} else {
				result[i/2] = buffer[i] - buffer[i+1];
			}
		}
		return result;
	}

}

module.exports = SSBDemod;