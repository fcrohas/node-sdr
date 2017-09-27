class FIR {
	constructor(sampleRate) {
		this.sampleRate = sampleRate;
		this.fir = null;
		this.window = null;
		this.bufferLength = 0;
		this.buffer = new Float32Array();
		this.output = new Float32Array();
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

	computeTapsLength(maxAttenuationDb, fStop, fPass) {
		const transitionBand = (fStop - fPass) / this.sampleRate;
		let taps = Math.round(maxAttenuationDb / (22 * transitionBand));
		console.log('Compute '+((taps%2) ? taps : taps+1)+' taps for '+maxAttenuationDb+' dB with fStop='+fStop+' fPass='+fPass+' fs='+this.sampleRate);		
		return (taps%2) ? taps : taps+1;
	}

	doFilter(input) {
		if (this.bufferLength != input.length + this.fir.length) {
			this.buffer = new Float32Array(input.length + this.fir.length); // IQ buffer so 2 bytes...
			this.bufferLength = input.length + this.fir.length;
			this.output = new Float32Array(input.length - this.fir.length);			
		}
		this.output.fill(0);
		this.buffer.set(input, this.fir.length);
		let outpos = 0;
		for (let n = this.fir.length; n < input.length; n += 2) {
			let inputp = this.buffer.subarray(n , n + this.fir.length);
/*			inputp = inputp.reverse();*/
			let pos = inputp.length - 1;
			for (let k = 0; k < this.fir.length; k+=2) {
				this.output[outpos] += this.fir[k] * inputp[pos - 1] + this.fir[k + 1] * inputp[pos];
				this.output[outpos + 1] += this.fir[k + 1] * inputp[pos - 1] - this.fir[k] * inputp[pos];
				pos-=2;
			}
			outpos += 2;
		}
		this.buffer.copyWithin(0, input.length - 1);
		return this.output;
	}

	doFilterReal(input) {
		if (this.bufferLength != input.length + this.fir.length / 2) {
			this.buffer = new Float32Array(input.length + this.fir.length / 2); // IQ buffer so 2 bytes...
			this.bufferLength = input.length + this.fir.length / 2;
			this.output = new Float32Array(input.length - this.fir.length / 2);			
		}
		this.output.fill(0);
		this.buffer.set(input, this.fir.length / 2);
		let outpos = 0;
		for (let n = this.fir.length / 2; n < input.length; n ++) {
			let inputp = this.buffer.subarray(n , n + this.fir.length / 2);
/*			inputp = inputp.reverse();*/
			let pos = inputp.length - 1;
			for (let k = 0; k < this.fir.length; k+=2) {
				this.output[outpos] += this.fir[k] * inputp[pos];
				pos--;
			}
			outpos++;
		}
		this.buffer.copyWithin(0, input.length - 1);
		return this.output;
	}
}

module.exports = FIR;