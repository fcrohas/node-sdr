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

	doDemodulate(floatarr) {
		if (this.updateDemodulate) {
			return null;
		}
		let xlatArr = new Float32Array(floatarr.length);
		// Shift frequency
		const wc0 = -2.0 * Math.PI * (this.frequency  - this.centerFrequency) / this.sampleRate;
		for (let i = 0; i < floatarr.length; i+=2) {
			xlatArr[i] = floatarr[i] * Math.cos(wc0 * i) - floatarr[i + 1] * Math.sin(wc0* (i + 1));
			xlatArr[i + 1] = floatarr[i + 1] * Math.sin(wc0 * (i + 1) ) + floatarr[i] * Math.cos(wc0 * i);
		}
		return xlatArr;
		// Decimate
		let d = 0;
		for (let i = 0; i < floatarr.length; i+=8) {
			xlatArr[d] = floatarr[i];
			xlatArr[d + 1] = floatarr[i + 1];
			d = d + 2;
		}
		let lpfiltered = this.lpfir.doFilter(xlatArr);
		const floatResult = this.demodulator.demodulate(lpfiltered);
		let arr8 = new Int8Array(floatResult.length);
		for (let i = 0; i < floatResult.length; i++) {
			arr8[i] = floatResult[i] * 255;
		}
		return arr8;

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