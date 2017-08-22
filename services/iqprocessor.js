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
		this.bandwidth = 150000;
		this.fftr = new KissFFT.FFT(size);
		this.order = 13;
		this.fftwindow = new Window(size);
		this.fftwindow.build(Window.hann);
		this.window = new Window(this.order);
		this.window.build(Window.hann);
		this.lpfir = new FIR(this.sampleRate, size + this.order);
		this.lpfir.setWindow(this.window.get());
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
	        output[i] = int / maxvalue;
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
			case 'FM' : this.demodulator = new FMDemod(0); break;
			case 'AM' : this.demodulator = new AMDemod(0); break;
			case 'USB' : this.demodulator = new SSBDemod('USB'); break;
			case 'LSB' : this.demodulator = new SSBDemod('LSB'); break;
		}
		this.updateDemodulate = false;
	}

	setBandwidth(bandwidth) {
		this.updateDemodulate = true;
		this.bandwidth = bandwidth;
		this.lpfir.buildLowpass(bandwidth / 2, this.order);
		this.updateDemodulate = false;

	}

	setFrequency(frequency) {
		this.updateDemodulate = true;
		this.frequency = frequency;
		this.updateDemodulate = false;
	}

	setCenterFrequency(centerFrequency) {
		this.updateDemodulate = true;
		this.centerFrequency = centerFrequency;
		this.updateDemodulate = false;
	}

	setSampleRate(sampleRate) {
		this.updateDemodulate = true;
		this.sampleRate = sampleRate;
		this.updateDemodulate = false;
	}

	doResample(pcmdata) {
		const fast = this.bandwidth;
		const slow = 22050;
		let i = 0;
		let i2 = 0;
		let now_lpr = 0;
		let prev_lpr_index = 0;
		while( i < pcmdata.length) {
			now_lpr += pcmdata[i];
			i++;
			prev_lpr_index += slow;
			if (prev_lpr_index < fast) {
				continue;
			}
			pcmdata[i2] = now_lpr / (fast/slow);
			prev_lpr_index -= fast;
			now_lpr = 0;
			i2 += 1;
		}
		let resample = new Int8Array(i2);
		resample.set(pcmdata.slice(0, i2));
		return resample;
	}

	doDemodulate(floatarr) {
		if (this.updateDemodulate) {
			return null;
		}
		let xlatArr = new Float32Array(floatarr.length);
		// Shift frequency
		const wc0 = -2.0 * Math.PI * (this.frequency  - this.centerFrequency) / this.sampleRate;
		for (let i = 0; i < floatarr.length; i+=2) {
			xlatArr[i] = floatarr[i] * Math.cos(wc0 * i) - floatarr[i + 1] * Math.sin(wc0* i);
			xlatArr[i + 1] = floatarr[i + 1] * Math.sin(wc0 * i) + floatarr[i] * Math.cos(wc0 * i);
		}
		// Decimate
		let d = 0;
		// decimate to closer power of 2
		let decim = 1 << 31 - Math.clz32(this.sampleRate / this.bandwidth);
		for (let i = 0; i < xlatArr.length; i+=decim*2) {
			xlatArr[d] = xlatArr[i];
			xlatArr[d + 1] = xlatArr[i + 1];
			d = d + 2;
		}
		let demodArr = new Float32Array(d + 1);
		let offset = 0;
		for (var k = 0; k < d + 1; k += this.size * 2) {
			var truncData = xlatArr.subarray(k, k + this.size * 2);
			let lpfiltered = this.lpfir.doFilter(truncData);
			const floatResult = this.demodulator.demodulate(lpfiltered);
			demodArr.set(floatResult, offset);
			offset += floatResult.length;			
		}
		let arr8 = new Int8Array(offset);
		for (let i = 0; i < offset; i++) {
			arr8[i] = demodArr[i] * 127;
		}
		return this.doResample(arr8);
	}

	doFFT(floatarr) {
		if (this.updateFFT) {
			return null;
		}
		var fftOut = new Int8Array(floatarr.length / 2);		
		let result = new Int8Array(this.size);
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
				const log = 20 * Math.log10(magnitude);
				// switch result here
				if (i < transformSize) {
					result[j + halfFft] = log;
				} else {
					result[j - halfFft] = log;
				}
				j++;
			}
			// store fft for this chunk
			fftOut.set(result, k / 2);

		}
		return fftOut;
	}
}

module.exports = IQProcessor;