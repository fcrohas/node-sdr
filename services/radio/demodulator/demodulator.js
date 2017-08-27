class Demodulator {
	constructor() {
		this.dc_avg = 0;
		this.prev_index = 0;
		this.now_r = 0;
		this.now_j = 0;
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

	decimate(dataarr, factor) {
		let d = 0;
		let d2 = 0;
		while (d < dataarr.length) {
			this.now_r += dataarr[d];
			this.now_j += dataarr[d + 1];
			d = d + 2;
			this.prev_index++;
			if (this.prev_index < factor) continue;
			dataarr[d2] = this.now_r;
			dataarr[d2 + 1] = this.now_j;
			this.prev_index = 0;
			this.now_r = 0;
			this.now_j = 0;
			d2+=2;
		}
		return d2;
	}
}

module.exports = Demodulator;