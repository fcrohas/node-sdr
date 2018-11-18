class FIR {
	constructor(sampleRate) {
		this.sampleRate = sampleRate;
		this.fir = null;
		this.window = null;
		this.bufferLength = 0;
		this.buffer = new Float32Array();
		this.output = new Float32Array();
		this.RegI = new Float32Array();
		this.RegQ = new Float32Array();
		this.NumTaps = 0;
		this.indexI1 = 0;
		this.indexI2 = 0;
		this.indexQ1 = 0;
		this.indexQ2 = 0;
	}

	setWindow(window) {
		this.window = window;
	}

	buildLowpass(frequencyCut, order) {
		const wc = 2 * Math.PI * frequencyCut / this.sampleRate;
		this.NumTaps = order;
		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N );
	    for (let j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[j] = wc;
	        }
	        else {
	            this.fir[j] = Math.sin(wc*(j-M/2))/((j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[j] = this.fir[j] * this.window[j];
	        }
	    }
	}

	buildHighpass(frequencyCut, order) {
		const wc = 2 * Math.PI * frequencyCut / this.sampleRate;
		this.NumTaps = order;
		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N);		

	    for (let j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[j] = 1 - wc / Math.PI;
	        }
	        else {
	            this.fir[j] = -1 * Math.sin(wc*(j-M/2))/(Math.PI*(j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[j] = this.fir[j] * this.window[j];
	        }
	    }
	}

	buildBandpass(centerFrequency, bandwidth, order) {
	    const wc1 = (2.0 * Math.PI * (centerFrequency-bandwidth/2.0)) / this.sampleRate;
	    const wc2 = (2.0 * Math.PI * (centerFrequency+bandwidth/2.0)) / this.sampleRate;
		this.NumTaps = order;
		const N = order;
		const M = order - 1;
		this.fir = new Float32Array( N );

		for (let j = 0; j < N ; j++) {
	        if (j == M/2) {
	            this.fir[j] = (wc2 - wc1)/Math.PI;
	        }
	        else {
	            this.fir[j] = Math.sin(wc2*(j-M/2))/(Math.PI*(j-M/2)) - Math.sin(wc1*(j-M/2))/(Math.PI*(j-M/2));
	        }
	        // Apply window
	        if (this.window != null) {
	            this.fir[j] = this.fir[j] * this.window[j];
	        }
	    }
	}

	buildStopband(centerFrequency, bandwidth, order) {
	    const wc1 = (2.0 * Math.PI * (centerFrequency-bandwidth/2.0)) / this.sampleRate;
	    const wc2 = (2.0 * Math.PI * (centerFrequency+bandwidth/2.0)) / this.sampleRate;
		this.NumTaps = order;
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
		this.NumTaps = order;		
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
		const transitionBand = Math.abs(fStop - fPass) / this.sampleRate;
		let taps = Math.round(maxAttenuationDb / (22 * transitionBand));
		console.log('Compute '+((taps%2) ? taps : taps+1)+' taps for '+maxAttenuationDb+' dB with fStop='+fStop+' fPass='+fPass+' fs='+this.sampleRate);		
		return (taps%2) ? taps : taps+1;
	}

	doFilterReal(input) {
		if (this.NumTaps * 2 != this.RegI.length) {
			this.RegI = new Float32Array(this.NumTaps * 2);
			this.indexI1 = 0;
			this.indexI2 = this.NumTaps;
		}

		this.RegI[this.indexI1] = input;
		this.RegI[this.indexI2] = input;
		let inew = 0;
		for (let i=0;i<this.NumTaps; i++) {
			inew = inew + this.fir[i] * this.RegI[this.indexI2 - i];
		}
		// renew index
		this.indexI1 = (this.indexI1 + 1) % this.NumTaps;
		this.indexI2 = this.indexI1 + this.NumTaps;

	  return inew;
	}

	doFilterIQ(I,Q) {
	  if (this.NumTaps * 2 != this.RegI.length) {
	  	this.RegI = new Float32Array(this.NumTaps * 2);
	  	this.RegQ = new Float32Array(this.NumTaps * 2);
		this.indexI1 = 0;
		this.indexI2 = this.NumTaps;
		this.indexQ1 = 0;
		this.indexQ2 = this.NumTaps;
	  }

		// I part
		this.RegI[this.indexI1] = I;
		this.RegI[this.indexI2] = I;
		// J part
		this.RegQ[this.indexQ1] = Q;
		this.RegQ[this.indexQ2] = Q;
		let inew = 0;
		let qnew = 0;
		for (let i=0; i<this.NumTaps; i++) {
			inew = inew + this.fir[i] * this.RegI[this.indexI2 - i];
			qnew = qnew + this.fir[i] * this.RegQ[this.indexQ2 - i];
		}
		// renew index
		this.indexI1 = (this.indexI1 + 1) % this.NumTaps;
		this.indexI2 = this.indexI1 + this.NumTaps;

		this.indexQ1 = (this.indexQ1 + 1) % this.NumTaps;
		this.indexQ2 = this.indexQ1 + this.NumTaps;
	  return [inew, qnew];
	}

}

module.exports = FIR;
