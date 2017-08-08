const KissFFT = require('kissfft-js');

class IQProcessor {

	constructor(size) {
		this.size = size;
		this.fftr = new KissFFT.FFT(size);
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
	
	int16ToFloat32(inputArray) {
		var output = new Float32Array(inputArray.length);
	    for (var i = 0; i < inputArray.length; i++) {
	        var int = inputArray[i];
	        output[i] = int / 16384;
	    }
	    return output;
	}

	floatToInt16(inputArray) {
		var output = new Float32Array(inputArray.length);
	    for (var i = 0; i < inputArray.length; i++) {
	        var float = inputArray[i];
	        output[i] = float * 16384;
	    }
	    return output;
	}

	doFft(data16arr) {
		// Convert Int16Array to Float32Array
		var transform = this.fftr.forward(this.int16ToFloat32(data16arr));
		var transScaled = transform; //this.scaleTransform(transform, this.size);
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