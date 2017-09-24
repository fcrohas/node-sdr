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
		this.order = 17;
		this.fftwindow = new Window(size);
		this.fftwindow.build(Window.hamming);
		this.decimationFactor = 1;
		this.xlat = { cosine: 1, sine: 0, deltaCosine: 0, deltaSine: 0};
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
		this.audiofilter = new FIR(this.audiorate/2);
		// compute filter taps length for 60 Db attenuation for fstop = audiorate + 3000Khz limit and fpass = adio pass
		const taps = this.audiofilter.computeTapsLength( 30, this.audioLowPassFrequency + 2500, this.audioLowPassFrequency);
		this.audiowindow = new Window(taps);
		this.audiowindow.build(Window.blackmanharris);
		this.audiofilter.setWindow(this.audiowindow.get());
		this.audiofilter.buildLowpass( this.audioLowPassFrequency, taps);
		//this.audiofilter.buildBandpass( 6050, 11500, taps);
		console.log('IQ demodulator audio rate change to ' + this.audiorate);
	}

	computeDecimation() {
		this.decimationFactor = 1 << 31 - Math.clz32(this.sampleRate / this.intermediate ); // this.bandwidth
		console.log('compute decimation factor='+this.decimationFactor);
	}

	computeFrequencyXlat() {
		this.wc0 = 2.0 * Math.PI * (this.centerFrequency - this.frequency) / this.sampleRate;				
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
	    		output[i] = int / (maxvalue  - 1);
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
				this.demodulator = new FMDemod(1, {dcblock: false, deemph: true}); 
				this.intermediate = 384000;
				this.audioLowPassFrequency = 7500;			
				this.rebuildFilters();	
				this.updateAudiorate(24000); // 24 khz for WFM
				break;
			case 'FM' : 
				this.demodulator = new FMDemod(0, {dcblock: false, deemph: false}); 
				this.intermediate = 96000;
				this.audioLowPassFrequency = 6000;				
				this.rebuildFilters();
				this.updateAudiorate(24000); // 24 khz for FM
				break;
			case 'AM' : 
				this.demodulator = new AMDemod(0);
				this.intermediate = 96000;
				this.audioLowPassFrequency = 2500;				
				this.rebuildFilters();
				this.updateAudiorate(24000); // 24 khz for AM
				break;
			case 'USB' : 
				this.demodulator = new SSBDemod('USB'); 
				this.intermediate = 96000;
				this.audioLowPassFrequency = 3500;
				this.rebuildFilters();
				this.updateAudiorate(24000); // 8 khz for SSB
				break;
			case 'LSB' : 
				this.demodulator = new SSBDemod('LSB'); 
				this.intermediate = 96000;
				this.audioLowPassFrequency = 3500;				
				this.rebuildFilters();
				this.updateAudiorate(24000); // 8 khz for SSB
				break;
		}
		this.updateDemodulate = false;
	}

	setBandwidth(bandwidth) {
		this.updateDemodulate = true;
		this.bandwidth = bandwidth;
		this.rebuildFilters();
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
		this.rebuildFilters();
		this.updateDemodulate = false;
	}

	rebuildFilters() {
		this.computeFrequencyXlat();		
		this.computeDecimation();
		this.lpfir = new FIR(this.sampleRate / this.decimationFactor);
		// compute filter taps length for 60 Db attenuation for fstop = bandwidth + 1/10eme limit and fpass = bandwidth
		const taps = this.lpfir.computeTapsLength( 50, this.bandwidth + this.bandwidth / 10, this.bandwidth); // 
		this.window = new Window(taps);
		this.window.build(Window.blackmanharris);
		this.lpfir.setWindow(this.window.get());
		this.lpfir.buildLowpass( this.bandwidth, taps);
		console.log('Rebuild for bandwidth=' + this.bandwidth);
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
		const resampled = this.doResample(demodulated);
		// band pass audio
		return this.audiofilter.doFilterReal(resampled);
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
				fftmean[j] = log + 64;
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