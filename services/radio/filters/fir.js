class FIR {
	constructor(sampleRate, maxbuffer) {
		this.sampleRate = sampleRate;
		this.fir = null;
		this.window = null;
		this.buffer = new Float32Array(maxbuffer * 2); // IQ buffer so 2 bytes...
	}

	setWindow(window) {
		this.window = window;
	}

	buildLowpass(frequencyCut, order) {
		const wc = 2 * Math.PI * frequencyCut / this.sampleRate;
		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N * 2);
	    for (let i = 0, j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[i] = wc / Math.PI;
	            this.fir[i + 1] = wc / Math.PI;
	        }
	        else {
	            this.fir[i] = Math.sin(wc*(j-M/2))/(Math.PI*(j-M/2));
	            this.fir[i + 1] = Math.cos(wc*(j-M/2))/(Math.PI*(j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[i] = this.fir[i] * this.window[j];
	            this.fir[i + 1] = this.fir[i + 1] * this.window[j];
	        }
	        i = i + 2;
	    }		
	}

	buildHighpass(frequencyCut, order) {
		const wc = 2 * Math.PI * frequencyCut / this.sampleRate;
		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N * 2);		

	    for (let i = 0, j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[i] = 1 - wc / Math.PI;
	            this.fir[i + 1] = 1 - wc / Math.PI;
	        }
	        else {
	            this.fir[i] = -1 * Math.sin(wc*(j-M/2))/(Math.PI*(j-M/2));
	            this.fir[i + 1] = -1 * Math.cos(wc*(j-M/2))/(Math.PI*(j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[i] = this.fir[i] * this.window[j];
	            this.fir[i + 1] = this.fir[i + 1] * this.window[j];
	        }
	        i = i + 2;
	    }
	}

	buildBandpass(centerFrequency, bandwidth, order) {
	    const wc1 = (2.0 * Math.PI * (centerFrequency-bandwidth/2.0)) / this.sampleRate;
	    const wc2 = (2.0 * Math.PI * (centerFrequency+bandwidth/2.0)) / this.sampleRate;

		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N * 2);

		for (let i = 0, j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[i] = (wc2 - wc1)/Math.PI;
	            this.fir[i + 1] = (wc2 - wc1)/Math.PI;
	        }
	        else {
	            this.fir[i] = Math.sin(wc2*(j-M/2))/(Math.PI*(j-M/2)) - Math.sin(wc1*(j-M/2))/(Math.PI*(j-M/2));
	            this.fir[i + 1] = Math.cos(wc2*(j-M)/2)/(Math.PI*(j-M/2)) - Math.cos(wc1*(j-M/2))/(Math.PI*(j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[i] = this.fir[i] * this.window[j];
	            this.fir[i + 1] = this.fir[i + 1] * this.window[j];
	        }
	        i = i + 2;
	    }
	}

	buildStopband(centerFrequency, bandwidth, order) {
	    const wc1 = (2.0 * Math.PI * (centerFrequency-bandwidth/2.0)) / this.sampleRate;
	    const wc2 = (2.0 * Math.PI * (centerFrequency+bandwidth/2.0)) / this.sampleRate;

		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N * 2);

		for (let i = 0, j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[i] = 1 - (wc2 - wc1)/Math.PI;
	            this.fir[i + 1] = 1 - (wc2 - wc1)/Math.PI;
	        }
	        else {
	            this.fir[i] = Math.sin(wc1*(j-M/2))/(Math.PI*(j-M/2)) - Math.sin(wc2*(j-M/2))/(Math.PI*(j-M/2));
	            this.fir[i + 1] = Math.cos(wc1*(j-M/2))/(Math.PI*(j-M/2)) - Math.cos(wc2*(j-M/2))/(Math.PI*(j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[i] = this.fir[i] * this.window[j];
	            this.fir[i + 1] = this.fir[i + 1] * this.window[j];
	        }
	        i = i + 2;
	    }
	}

	buildAllpass(order) {
		const N = order;
		this.fir = new Float32Array(N * 2);
		for (let i = 0, j = 0; j < N ; j++) {
			this.fir[i] = 1.0;
			this.fir[i + 1] = 1.0;
			if (this.window != null) {
	            this.fir[i] = this.fir[i] * this.window[j];
	            this.fir[i + 1] = this.fir[i + 1] * this.window[j];
			}
			i = i + 2;
		}
	}

	doFilter(input) {
		let output = new Float32Array(input.length);
		this.buffer.set(input, this.fir.length);
		for (let n = 0; n < input.length; n += 2) {
			let inputp = this.buffer.subarray(n , n + this.fir.length);
/*			inputp = inputp.reverse();*/
			for (let k = 0; k < this.fir.length; k+=2) {
				output[n] += this.fir[k] * inputp[k] - this.fir[k + 1] * inputp[k + 1];
				output[n + 1] += this.fir[k] * inputp[k + 1] + this.fir[k + 1] * inputp[k];
			}
		}
		this.buffer.set(input.slice(input.length - this.fir.length));
		return output;
	}
}

module.exports = FIR;