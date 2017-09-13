const KissFFT = require('kissfft-js');
const FIR = require('./radio/filters/fir');
const Window = require('./radio/filters/window');
const AMDemod = require('./radio/demodulator/amdemod');
const FMDemod = require('./radio/demodulator/fmdemod');
const SSBDemod = require('./radio/demodulator/ssbdemod');

class IQProcessor {

	constructor(size) {
		this.updateDemodulate = false;
		this.updateFFT = false;
		this.demodulator = null;
		this.size = size;
		this.sampleRate = 2048000;
		this.audiorate = 24000
		this.bandwidth = 150000;
		this.intermediate = 256000;
		this.fftr = new KissFFT.FFT(size);
		this.order = 9;
		this.fftwindow = new Window(size);
		this.fftwindow.build(Window.hamming);
		this.decimationFactor = 1;
		this.xlat = { cosine: 0, sine: 0, deltaCosine: 0, deltaSine: 0};
		this.xlatArr = null;		
		this.wc0 = 0;
		this.computeDecimation();
		this.updateAudiorate(this.audiorate);
		this.now_lpr = 0;
		this.prev_lpr_index = 0;
		this.fftResult = new Float32Array(this.size);		
	}

	updateAudiorate(audiorate) {
		this.audiorate = audiorate;
		this.audiofilter = new FIR(this.audiorate);
		this.audiowindow = new Window(17);
		this.audiowindow.build(Window.blackman);
		this.audiofilter.setWindow(this.audiowindow.get());
		this.audiofilter.buildLowpass( this.audioLowPassFrequency, 17);
		//this.audiofilter.buildBandpass( 7550, 15000, 25);
		console.log('IQ demodulator audio rate change to ' + this.audiorate);
	}

	computeDecimation() {
		this.decimationFactor = 1 << 31 - Math.clz32(this.sampleRate / this.intermediate ); // this.bandwidth
		console.log('compute decimation factor='+this.decimationFactor);
	}

	computeFrequencyXlat() {
		this.wc0 = 2.0 * Math.PI * (this.frequency  - this.centerFrequency) / this.sampleRate;				
		// update delta(s)
		this.xlat.deltaCosine = Math.cos(this.wc0);
		this.xlat.deltaSine = Math.sin(this.wc0);
	}

	canDemodulate() {
		return (this.demodulator!=null) ? true : false;
	}

	scaleTransform(trans, size) {
		var i = 0,
        bSi = 1.0 / size,
        x = trans;
	    while(i < x.length) {
	        x[i] *= bSi; i++;
	    }
	    return x;
	}
	
	intToFloat32(inputArray) {
		var maxvalue = Math.pow(2,inputArray.BYTES_PER_ELEMENT * 8) / 2;
		var output = new Float32Array(inputArray.length);
	    for (var i = 0; i < inputArray.length; i++) {
	        var int = inputArray[i];
	        if (int < 0) {
	        	output[i] = int / maxvalue;
	    	} else {
	    		output[i] = int / (maxvalue - 1);
	    	}
	    }
	    return output;
	}

	convertToFloat(dataarr) {
		// Convert Int16Array to Float32Array
		var floatarr = null;
		if (dataarr instanceof Float32Array) {
			floatarr = dataarr;
		} else {
			floatarr = this.intToFloat32(dataarr);
		}
		return floatarr;
	}

	setModulation(modulation) {
		this.updateDemodulate = true;
		switch(modulation) {
			case 'WFM' : 
				this.demodulator = new FMDemod(1, {dcblock: true, deemph: true}); 
				this.intermediate = 256000;
				this.audioLowPassFrequency = 15000;				
				this.updateAudiorate(24000); // 24 khz for WFM
				break;
			case 'FM' : 
				this.demodulator = new FMDemod(0, {dcblock: false, deemph: false}); 
				this.intermediate = 256000;
				this.audioLowPassFrequency = 6000;				
				this.updateAudiorate(24000); // 24 khz for FM
				break;
			case 'AM' : 
				this.demodulator = new AMDemod(0);
				this.intermediate = 64000;
				this.audioLowPassFrequency = 4500;				
				this.updateAudiorate(24000); // 24 khz for AM
				break;
			case 'USB' : 
				this.demodulator = new SSBDemod('USB'); 
				this.intermediate = 96000;
				this.audioLowPassFrequency = 2500;
				this.updateAudiorate(24000); // 8 khz for SSB
				break;
			case 'LSB' : 
				this.demodulator = new SSBDemod('LSB'); 
				this.intermediate = 96000;
				this.audioLowPassFrequency = 2500;				
				this.updateAudiorate(24000); // 8 khz for SSB
				break;
		}
		this.updateDemodulate = false;
	}

	setBandwidth(bandwidth) {
		this.updateDemodulate = true;
		this.bandwidth = bandwidth;
		this.computeDecimation();
		this.window = new Window(this.order);
		this.window.build(Window.hamming);
		this.lpfir = new FIR(this.sampleRate / this.decimationFactor);
		this.lpfir.setWindow(this.window.get());
		this.lpfir.buildLowpass( this.bandwidth / 2, this.order);
		console.log('Bandwidth change to : ' + this.bandwidth);
		this.updateDemodulate = false;

	}

	setFrequency(frequency) {
		this.updateDemodulate = true;
		this.frequency = frequency;
		this.computeFrequencyXlat();
		this.updateDemodulate = false;
	}

	setCenterFrequency(centerFrequency) {
		this.updateDemodulate = true;
		this.centerFrequency = centerFrequency;
		this.computeFrequencyXlat();
		this.updateDemodulate = false;
	}

	setSampleRate(sampleRate) {
		this.updateDemodulate = true;
		this.sampleRate = sampleRate;
		this.computeFrequencyXlat();		
		this.computeDecimation();
		this.updateDemodulate = false;
	}

	getAudiorate() {
		return this.audiorate;
	}

	setAudiorate(value) {
		this.audiorate = value;
		this.updateAudiorate(value);
	}

	doResample(pcmdata) {
		const fast = this.sampleRate / this.decimationFactor;
		const slow = this.audiorate;
		let i = 0;
		let i2 = 0;
		while( i < pcmdata.length) {
			this.now_lpr += pcmdata[i];
			i++;
			this.prev_lpr_index += slow;
			if (this.prev_lpr_index < fast) {
				continue;
			}
			pcmdata[i2] = this.now_lpr / (fast/slow);
			this.prev_lpr_index -= fast;
			this.now_lpr = 0;
			i2 += 1;
		}
		return pcmdata.subarray(0, i2);
	}

	xlatFrequency(floatarr) {
		if ((this.xlatArr == null) || (this.xlatArr.length != floatarr.length)) {
			this.xlatArr = new Float32Array(floatarr.length);
		}
		// translate if required
		if (this.wc0 != 0) {
			// Code from Google Radio
			// better implementation that my previous
			for (let i = 0; i < floatarr.length; i+=2) {
				this.xlatArr[i] = floatarr[i] * this.xlat.cosine - floatarr[i + 1] * this.xlat.sine;
				this.xlatArr[i + 1] = floatarr[i] * this.xlat.sine + floatarr[i + 1] * this.xlat.cosine;
				// compute new cos/sin
				var newSine = this.xlat.cosine * this.xlat.deltaSine + this.xlat.sine * this.xlat.deltaCosine;
				this.xlat.cosine = this.xlat.cosine * this.xlat.deltaCosine - this.xlat.sine * this.xlat.deltaSine;
				this.xlat.sine = newSine;
			}
		} else {
			this.xlatArr.set(floatarr);
		}
		return this.xlatArr;
	}

	doDemodulate(floatarr) {
		if (this.updateDemodulate) {
			return null;
		}
		// translate frequency
		const xlating = this.xlatFrequency(floatarr);
		// Decimate
		const decimatedArr = this.demodulator.decimate(xlating, this.decimationFactor);
		// low pass filter decimated array with user bandwidth
		const lpfiltered = this.lpfir.doFilter(decimatedArr);
		// demodulate audio
		const demodulated = this.demodulator.demodulate(lpfiltered);
		// do resample to audio samplerate
		const resampeld = this.doResample(demodulated);
		// low pass audio
		return this.audiofilter.doFilterReal(resampeld);
	}

	doFFT(floatarr) {
		if (this.updateFFT) {
			return null;
		}
		let average = 32;
		var fftOut = new Float32Array(floatarr.length);		
		var fftmean = new Uint8Array(floatarr.length / 2 / average);
		for (var k = 0; k < floatarr.length; k += this.size * 2) {
			// fft size is 512 so double buffer
			// Apply window
			var truncData = floatarr.subarray(k, k + this.size * 2);
			for (let c = 0; c < this.size * 2; c+=2) {
				truncData[c] = this.fftwindow.get()[c / 2] * truncData[c];
				truncData[c + 1] = this.fftwindow.get()[c / 2] * truncData[c + 1];
			}
			var transform = this.fftr.forward(truncData);
			// compute magnitude with db log
			// let j = 0;
			var transformSize = transform.length / 2;
			// const halfFft = this.size / 2;
			fftOut.set(transform.subarray(transformSize), k);
			fftOut.set(transform.subarray(0, transformSize), k + transformSize);
		}
		// Average last n result
		let j = 0;
		// average power
		//this.result.fill(0);
		for (let a = 0; a < fftOut.length; a+=this.size * 2 * average) {
			// sum them
			for (let b = 0; b < this.size * 2 * average; b+=this.size * 2) {
				for (let c = 0; c < this.size * 2; c+=2) {
					let I = fftOut[a + b + c];
					let Q = fftOut[a + b + c + 1];
					const magnitude = I * I + Q * Q;
					this.fftResult[c/2] += magnitude;
				}
			}
			// Compute fft
			for (let i = 0; i < this.size; i ++) {
				this.fftResult[i] = Math.sqrt(this.fftResult[i] / average);
				const log = 20 * Math.log10(this.fftResult[i]);
				// switch result here
				fftmean[j] = log + 128;
				//min = Math.min(log, min);
				//max = Math.max(log, max);
				j++;
			}
		}
		// Compute fft
		// let min = 0;
		// let max = -200;
		// for (let a = 0; a < fftOut.length; a+=this.size * 2 * average) {
		// 	// sum them
		// 	for (let b = 0; b < this.size * 2 * average; b+=this.size * 2) {
		// 		for (let c = 0; c < this.size * 2; c+=2) {
		// 			result[c] += fftOut[a + b + c];
		// 			result[c + 1] += fftOut[a + b + c + 1];
		// 		}
		// 	}
		// 	// Compute fft
		// 	for (let i= 0; i < this.size * 2; i += 2) {
		// 		let I = result[i] / average;
		// 		let Q = result[i + 1] / average;
		// 		const magnitude = Math.sqrt(I * I + Q * Q);
		// 		const log = 20 * Math.log10(magnitude);
		// 		// switch result here
		// 		fftmean[j] = log + 128;
		// 		min = Math.min(log, min);
		// 		max = Math.max(log, max);
		// 		j++;
		// 	}
		// }
		// console.log('max=',max,'min=',min);
		return fftmean;
	}
}

module.exports = IQProcessor;