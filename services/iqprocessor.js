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
		this.fftwindow.build(Window.hann);
		this.decimationFactor = 1;
		this.xlatvectArr = null;
		this.xlatArr = null;		
		this.wc0 = 0;
		this.computeDecimation();
		this.updateAudiorate(this.audiorate);
		this.now_lpr = 0;
		this.prev_lpr_index = 0;
	}

	updateAudiorate(audiorate) {
		this.audiorate = audiorate;
		this.audiofilter = new FIR(this.audiorate);
		this.audiowindow = new Window(57);
		this.audiowindow.build(Window.blackman);
		this.audiofilter.setWindow(this.audiowindow.get());
		this.audiofilter.buildLowpass( this.audiorate / 2, 57);
		console.log('IQ demodulator audio rate change to ' + this.audiorate);
	}

	computeDecimation() {
		this.decimationFactor = 1 << 31 - Math.clz32(this.sampleRate / this.intermediate ); // this.bandwidth
		console.log('compute decimation factor='+this.decimationFactor);
	}

	computeFrequencyXlat() {
		this.wc0 = -2.0 * Math.PI * (this.frequency  - this.centerFrequency) / this.sampleRate;				
		this.xlatvectArr = null;
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
				this.demodulator = new FMDemod(1); 
				this.intermediate = 256000;
				this.updateAudiorate(24000); // 24 khz for WFM
				break;
			case 'FM' : 
				this.demodulator = new FMDemod(0); 
				this.intermediate = 256000;
				this.updateAudiorate(24000); // 24 khz for FM
				break;
			case 'AM' : 
				this.demodulator = new AMDemod(0);
				this.intermediate = 128000;
				this.updateAudiorate(16000); // 16 khz for AM
				break;
			case 'USB' : 
				this.demodulator = new SSBDemod('USB'); 
				this.intermediate = 128000;
				this.updateAudiorate(8000); // 8 khz for SSB
				break;
			case 'LSB' : 
				this.demodulator = new SSBDemod('LSB'); 
				this.intermediate = 32000;
				this.updateAudiorate(8000); // 8 khz for SSB
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
		this.lpfir.buildLowpass( this.bandwidth, this.order);
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

	doDemodulate(floatarr) {
		if (this.updateDemodulate) {
			return null;
		}
		if ((this.xlatArr == null) || (this.xlatArr.length != floatarr.length)) {
			this.xlatArr = new Float32Array(floatarr.length);
		}
		// Prepare translation only if needed
		if (((this.xlatvectArr ==null) || (this.xlatvectArr.length != floatarr.length)) && (this.wc0 != 0)) {
			this.xlatvectArr = new Float32Array(floatarr.length);
			let sinc = 0;
			for (let i = 0; i < floatarr.length; i+=2) {
				this.xlatvectArr[i] = Math.cos(this.wc0 * sinc);
				this.xlatvectArr[i + 1] = Math.sin(this.wc0 * sinc);
				sinc++;
			}
		}
		// translate if required
		if (this.wc0 != 0) {
			for (let i = 0; i < floatarr.length; i+=2) {
				this.xlatArr[i] = floatarr[i] * this.xlatvectArr[i] - floatarr[i + 1] * this.xlatvectArr[i + 1];
				this.xlatArr[i + 1] = floatarr[i + 1] * this.xlatvectArr[i] + floatarr[i] * this.xlatvectArr[i + 1];
			}
		} else {
			this.xlatArr.set(floatarr);
		}

		// Decimate
		const d2 = this.demodulator.decimate(this.xlatArr, this.decimationFactor);
		// use new length for decimated array
		const decimatedArr = this.xlatArr.subarray(0, d2);
		// low pass filter decimated array to affine result
		const lpfiltered = this.lpfir.doFilter(decimatedArr);
		// demodulate audio
		const floatResult = this.demodulator.demodulate(lpfiltered);
		// do resample to audio samplerate
		const resample = this.doResample(floatResult);
		// low pass audio
		return this.audiofilter.doFilterReal(resample);
	}

	doFFT(floatarr) {
		if (this.updateFFT) {
			return null;
		}
		var fftOut = new Uint8Array(this.size);		
		let result = new Uint8Array(this.size);
		let prevresult = new Uint8Array(this.size);
		for (var k = 0; k < floatarr.length; k += this.size * 2) {
			// fft size is 512 so double buffer
			var truncData = floatarr.subarray(k, k + this.size * 2);
			var transform = this.fftr.forward(truncData);
			// compute magnitude with db log
			let j = 0;
			var transformSize = transform.length / 2;
			const halfFft = this.size / 2;
			for (var i=0; i < transform.length; i += 2) {
				const magnitude = Math.sqrt(transform[i] * transform[i] + transform[i+1] * transform[i+1])
				//const log = 20 * Math.log10(magnitude);
				// switch result here
				if (i < transformSize) {
					result[j + halfFft] = magnitude * 255;
				} else {
					result[j - halfFft] = magnitude * 255;
				}
				j++;
			}
			// Average result
			if (k == 0) {
				// store fft for this chunk
				prevresult.set(result);
			} else {
				// average results
				for (let a = 0; a < fftOut.length; a++) {
					fftOut[a] = (prevresult[a] + result[a]) / 2;
					prevresult.set(fftOut);
				}
			}
		}
		return fftOut;
	}
}

module.exports = IQProcessor;