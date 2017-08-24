class AMDemod {

	constructor(mode) {
		this.dc_avg = 0;
	}

	dc_block_filter(pcm) {
		let avg = 0;
		let sum = 0;
		for (let i=0; i < pcm.length; i++) {
			sum += pcm[i];
		}
		avg = sum / pcm.length;
		avg = (avg + this.dc_avg * 9) / 10;
		for (let i=0; i < pcm.length; i++) {
			pcm[i] -= avg;
		}
		this.dc_avg = avg;
		return pcm;
	}

	demodulate(buffer) {
		let result = new Float32Array(buffer.length / 2);
		for (let i = 0; i < buffer.length; i+=2) {
			result[i/2] = Math.sqrt(buffer[i] * buffer[i] + buffer[i+1] * buffer[i + 1]);
		}
		return this.dc_block_filter(result);
	}

}

module.exports = AMDemod;