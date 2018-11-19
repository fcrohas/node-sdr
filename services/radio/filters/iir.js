class IIR {
	constructor(sampleRate) {
		this.sampleRate = sampleRate;
		this.Fili = require('fili');
	}

	buildHighpass(order, cutoff) {
		const iirCalculator = new this.Fili.IirCoeffs();
		this.coeffs = iirCalculator.highpass({
		    order: order, // cascade 3 biquad filters (max: 5)
		    characteristic: 'tschebyscheff05',
		    transform: 'matchedZ',
		    Fs: this.sampleRate, // sampling frequency
		    Fc: cutoff, // cutoff frequency / center frequency for bandpass, bandstop, peak
		    preGain: false // uses k when true for gain correction b[0] otherwise
		  });
		this.iirI = new this.Fili.IirFilter(this.coeffs);
		this.iirQ = new this.Fili.IirFilter(this.coeffs);
	}

	buildLowpass(order, cutoff) {
		const iirCalculator = new this.Fili.IirCoeffs();
		this.coeffs = iirCalculator.lowpass({
		    order: order, // cascade 3 biquad filters (max: 5)
		    characteristic: 'tschebyscheff3',
		    transform: 'matchedZ',
		    Fs: this.sampleRate, // sampling frequency
		    Fc: cutoff, // cutoff frequency / center frequency for bandpass, bandstop, peak
		    preGain: false // uses k when true for gain correction b[0] otherwise
		  });
		this.iirI = new this.Fili.IirFilter(this.coeffs);
		this.iirQ = new this.Fili.IirFilter(this.coeffs);
	}

	doFilterIQ(I,Q) {
		return [this.iirI.singleStep(I),this.iirQ.singleStep(Q)];
	}

	doFilterReal(I) {
		return this.iirI.singleStep(I);
	}
}

module.exports = IIR;
