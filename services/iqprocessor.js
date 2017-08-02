const KissFFT = require('kissfft-js');

class IQProcessor {

	constructor(size) {
		this.size = size;
		this.fftr = new KissFFT.FFTR(size);
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
	
	doFft(data16arr) {
		var transform = this.fftr.forward(data16arr);
		var transScaled = this.scaleTransform(transform, this.size);
		// compute magnitude with db log
		var result = new Int16Array(this.size);
		var j = 0;
		for (var i=0; i < transform.length; i += 1) {
			var magnitude = Math.sqrt(transScaled[i] * transScaled[i])
			result[j] = 20 * Math.log10(magnitude);
			j++;
		}
		return result;
	}
}

module.exports = IQProcessor;