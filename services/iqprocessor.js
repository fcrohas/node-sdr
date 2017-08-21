const KissFFT = require('kissfft-js');
const FIR = require('./radio/filters/fir');
const Window = require('./radio/filters/window');

class IQProcessor {

	constructor(size) {
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
		this.lpfir.buildLowpass(100000, this.order);
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

	doDemodulate(floatarr) {
		let xlatArr = new Float32Array(floatarr.length);
		// Shift frequency
		const wc0 = -2.0 * Math.PI * 50000 / this.sampleRate;
		for (let i = 0; i < floatarr.length; i+=2) {
			xlatArr[i] = floatarr[i] * Math.cos(wc0 * i) - floatarr[i + 1] * Math.sin(wc0* (i + 1));
			xlatArr[i + 1] = floatarr[i + 1] * Math.sin(wc0 * (i + 1) ) + floatarr[i] * Math.cos(wc0 * i);
		}
		return xlatArr;
		// Decimate
		// let d = 0;
		// for (let i = 0; i < floatarr.length; i+=8) {
		// 	xlatArr[d] = floatarr[i];
		// 	xlatArr[d + 1] = floatarr[i + 1];
		// 	d = d + 2;
		// }
		// let lpfiltered = this.lpfir.doFilter(xlatArr);

	}

	doFft(floatarr) {
		var transform = this.fftr.forward(floatarr);
		// compute magnitude with db log
		let result = new Int8Array(this.size);
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
		return result;
	}

	doProcess(dataarr) {
		// Convert Int16Array to Float32Array
		var floatarr = null;
		if (dataarr instanceof Float32Array) {
			floatarr = dataarr;
		} else {
			floatarr = this.intToFloat32(dataarr);
		}
		return this.doFft(floatarr);
	}
}

module.exports = IQProcessor;