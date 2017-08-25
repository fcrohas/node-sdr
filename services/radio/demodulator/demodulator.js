class Demodulator {
	constructor() {
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

	decimate(dataarr, factor) {
		let d = 0;
		let d2 = 0;
		let prev_index = 0;
		let now_r = 0;
		let now_j = 0;
		while (d < dataarr.length) {
			now_r += dataarr[d];
			now_j += dataarr[d + 1];
			d = d + 2;
			prev_index++;
			if (prev_index < decim) continue;
			dataarr[d2] = now_r;
			dataarr[d2 + 1] = now_j;
			prev_index = 0;
			now_r = 0;
			now_j = 0;
			d2+=2;
		}
		return dataarr;
	}
}

module.exports = Demodulator;