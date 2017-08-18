const KissFFT = require('kissfft-js');
const FIR = require('./radio/filters/fir');
const Window = require('./radio/filters/window');

class IQProcessor {

	constructor(size) {
		this.size = size;
		this.fftr = new KissFFT.FFT(size);
		this.order = 41;
		this.window = new Window(this.order);
		this.window.build(Window.hann);
		this.fir = new FIR(900001, size + this.order);
		this.fir.setWindow(this.window.get());
		this.fir.buildLowpass(25000,this.order);
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

	doFft(dataarr) {
		// Convert Int16Array to Float32Array
		var transform = null;
		var floatarr = null;
		if (dataarr instanceof Float32Array) {
			floatarr = dataarr;
		} else {
			floatarr = this.intToFloat32(dataarr);
		}
		let filtered = this.fir.doFilter(floatarr);
		transform = this.fftr.forward(filtered);
		// compute magnitude with db log
		var result = new Float32Array(this.size);
		var j = 0;
		for (var i=0; i < transform.length; i += 2) {
			var magnitude = Math.sqrt(transform[i] * transform[i] + transform[i+1] * transform[i+1])
			result[j] = 20 * Math.log10(magnitude);
			j++;
		}
		return result;
	}
}

module.exports = IQProcessor;