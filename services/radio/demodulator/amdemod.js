const Demodulator = require('./demodulator');

class AMDemod extends Demodulator  {

	constructor(mode,opts) {
		super(opts.samplerate);
		this.halfPoint = 0;
		this.IAv = 0;
		this.QAv = 0;
	}

	demodulate(buffer) {
		super.demodulate(buffer);
		// to work
		let sigSum = 0;
		var IAv = 0;
		var QAv = 0;
		for (let i = 0,j=0; i < buffer.length; i+=2) {
		    IAv += buffer[i];
		    QAv += buffer[i + 1];
		}
		IAv = IAv / (buffer.length /2);
		QAv = QAv / (buffer.length /2);
		// Average i ad Q
		for (let i = 0,j=0; i < buffer.length; i+=2) {
			let iv = buffer[i];// - IAv;
			let qv = buffer[i + 1];// - QAv;
			const amplitude = Math.sqrt( iv * iv + qv * qv);
			this.result[j] = amplitude;
			sigSum += amplitude;
			j++;
		}
	    const halfPoint = sigSum / this.result.length;
	    for (let i = 0; i < this.result.length; ++i) {
	     this.result[i] = (this.result[i] - halfPoint) / halfPoint * 0.05;
	    }
	    return this.result;
	}

	demodulateSingle(I,Q) {
		const In = I;// - this.IAv;
		const Qn = Q;// - this.QAv;
		let amplitude = Math.sqrt( In * In + Qn * Qn) * 0.0003;
		this.halfPoint = (amplitude + this.halfPoint) / 2;
		amplitude  = (amplitude - this.halfPoint) / this.halfPoint;
		this.IAv = (I + this.IAv) / 2;
		this.QAv = (Q + this.QAv) / 2;
		return super.automaticGainControl(amplitude,0.0003);

	}

}
module.exports = AMDemod;
