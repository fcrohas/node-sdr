class Demodulator {
	constructor() {
		this.dc_avg = 0;
		this.prev_index = 0;
		this.now_r = 0;
		this.now_j = 0;
		this.result = new Float32Array();		
	}

	dc_block_filter(pcm) {
		let avg = 0;
		// Do average
		for (let i=0; i < pcm.length; i++) {
			avg += pcm[i];
		}
		avg = avg / pcm.length;
		// Diff from previous run
		const avgdiff = avg - this.dc_avg;
		// Remove dc
		for (let i=0; i < pcm.length; i++) {
			pcm[i] -= this.dc_avg + avgdiff * i / pcm.length;
		}
		this.dc_avg = avgdiff;
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
		// Cut to new length
		return dataarr.subarray(0, d2);
	}

	demodulate(buffer) {
		// Allocate new buufer only if needed
		if (this.result.length != buffer.length / 2) {
			this.result = new Float32Array(buffer.length / 2);
		}
	}
}

module.exports = Demodulator;