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
	}

	setWindow(window) {
		this.window = window;
	}

	buildLowpass(frequencyCut, order) {
		const wc = 2 * Math.PI * frequencyCut / this.sampleRate;
		this.NumTaps = order;
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
		this.NumTaps = order;
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
		this.NumTaps = order;
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

	doFilterIQ(input)
	{
	  let Top = 0;
	  let n = 0;
	  if (this.NumTaps != this.RegI.length) {
	  	this.RegI = new Float32Array(this.NumTaps);
	  	this.RegQ = new Float32Array(this.NumTaps);
	  }

	  if (input.length != this.output.length) {
	  	this.output = new Float32Array(input.length);
	  }
	  this.output.fill(0);

	  for(let j=0; j < this.NumTaps; j++) {
	  	this.RegI[j] = 0.0;
	  	this.RegQ[j] = 0.0;
	  }

	  for(let j=0; j < input.length + this.NumTaps * 2; j += 2)
	   {
	    this.RegI[Top] = input[j];
	    this.RegQ[Top] = input[j + 1];
	    n = 0;

	    // The FirCoeff index increases while the Reg index decreases.
	    for(let k= Top; k >= 0; k--)
	    {
	      this.output[j] += this.fir[n] * this.RegI[k];
	      this.output[j + 1] += this.fir[n + 1] * this.RegQ[k];
	      n += 2;
	    }
	    for(let k= this.NumTaps - 1; k > Top; k--)
	    {
	      this.output[j] += this.fir[n] * this.RegI[k];
	      this.output[j + 1] += this.fir[n + 1] * this.RegQ[k];
	      n += 2;
	    }

	    Top++;

	    if(Top >= this.NumTaps) {
	    	Top = 0;
	    }
	   }
	   return this.output;
	}

	doFilterReal2(input)
	{
	  let Top = 0;
	  let n = 0;
	  if (this.NumTaps != this.RegI.length) {
	  	this.RegI = new Float32Array(this.NumTaps);
	  }

	  if (input.length != this.output.length) {
	  	this.output = new Float32Array(input.length);
	  }
	  this.output.fill(0);

	  for(let j=0; j < this.NumTaps; j++) {
	  	this.RegI[j] = 0.0;
	  }

	  for(let j=0; j < input.length + this.NumTaps; j ++)
	   {
	    this.RegI[Top] = input[j];
	    n = 0;

	    // The FirCoeff index increases while the Reg index decreases.
	    for(let k= Top; k >= 0; k--)
	    {
	      this.output[j] += this.fir[n] * this.RegI[k];
	      n++;
	    }
	    for(let k= this.NumTaps - 1; k > Top; k--)
	    {
	      this.output[j] += this.fir[n] * this.RegI[k];
	      n++;
	    }

	    Top++;

	    if(Top >= this.NumTaps) {
	    	Top = 0;
	    }
	   }
	   return this.output;
	}
}

module.exports = FIR;