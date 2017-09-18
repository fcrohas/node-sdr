const Demodulator = require('./demodulator');

class FMDemod extends Demodulator {

	constructor(mode, opts) {
		super();
		this.pre_r = 0;
		this.pre_j = 0;
		this.avg = 0;
		this.enableDeemphasis = opts.deemph;
		this.enableDcblock = opts.dcblock;
		this.discriminant = null;
		this.deemph_a = Math.round(1.0/((1.0-Math.exp(-1.0/(384000 * 50e-6)))));
		switch(mode) {
			case 0 : this.discriminant = this.polar_disc_fast; break;
			case 1 : this.discriminant = this.polar_discriminant; break;
			case 2 : this.discriminant = this.esbensen; break;
			default: this.discriminant = this.polar_disc_fast;
		}
	}

	/*
	  input signal: s(t) = a*exp(-i*w*t+p)
	  a = amplitude, w = angular freq, p = phase difference
	  solve w
	  s' = -i(w)*a*exp(-i*w*t+p)
	  s'*conj(s) = -i*w*a*a
	  s'*conj(s) / |s|^2 = -i*w
	*/
	esbensen(ar, aj, br, bj)
	{
		let dr = (br - ar) * 2;
		let dj = (bj - aj) * 2;
		let cj = bj*dr - br*dj; 
		return cj / (ar*ar+aj*aj+1);
	}

	// http://dspguru.com/dsp/tricks/fixed-point-atan2-with-self-normalization
	fast_atan2(y, x)
	{
	  	let coeff_1 = Math.PI / 4;
	  	let coeff_2 = 3 * coeff_1;
	  	let abs_y = y > 0 ? y : -y;
	  	let angle, r;
	  	if (x >= 0) {
	  		r = (x - abs_y) / (x + abs_y);
	  		angle = coeff_1 - coeff_1 * r;
	  	} else {
	  		r = (x + abs_y) / (abs_y - x);
	  		angle = coeff_2 - coeff_1 * r;
	  	}
	  	return y < 0 ? -angle : angle;
	}

	fast_atan2_bis(y,x) {
		return Math.asin(y/Math.sqrt(x*x + y*y));
	}

	polar_discriminant(ar, aj, br, bj)
	{
		const complex = this.multiply(ar, aj, br, -bj);
		const angle = Math.atan2(complex.cj, complex.cr);
		return angle / Math.PI;
	}

	multiply(ar, aj, br, bj) {
		return {
			cr : ar * br - aj * bj,
			cj : aj * br + ar * bj
		};
	}

	polar_disc_fast(ar, aj, br, bj) {
		const complex = this.multiply(ar, aj, br, -bj);
		return this.fast_atan2_bis(complex.cj, complex.cr);

	}

	deemph_filter(pcm)
	{
		let d = 0;
		// de-emph IIR
		// avg = avg * (1 - alpha) + sample * alpha;
		for (let i = 0; i < pcm.length; i++) {
			d = pcm[i] - this.avg;
			if (d > 0) {
				this.avg = this.avg + (d + this.deemph_a / 2.0) / this.deemph_a;
			} else {
				this.avg = this.avg + (d - this.deemph_a / 2.0) / this.deemph_a;
			}
			pcm[i] = this.avg;
		}
		return pcm;
	}

	demodulate(buffer) {
		// 
		super.demodulate(buffer);
		let pr = this.pre_r;
		let pj = this.pre_j;
		for (let i = 0; i < buffer.length; i+=2) {
			this.result[i/2] = this.discriminant(buffer[i], buffer[i+1], pr, pj);
			pr = buffer[i];
			pj = buffer[i + 1];
		}

		this.pre_r = pr;
		this.pre_j = pj;

		if (this.enableDcblock) {
			this.result = this.dc_block_filter(this.result); 
		}
		if (this.enableDeemphasis) {
			this.result = this.deemph_filter(this.result);
		}

		return this.result;
	}
}

module.exports = FMDemod;