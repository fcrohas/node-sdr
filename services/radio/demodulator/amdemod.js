const Demodulator = require('./demodulator');

class AMDemod extends Demodulator  {

	constructor(mode) {
		super();
	}

	demodulate(buffer) {
		super.demodulate(buffer);
		// to work
		let sigSum = 0;
		// Average i ad Q
		let iAvg = 0;
		let qAvg = 0;
		for (let i=0; i< buffer.length; i += 2) {
			iAvg += buffer[i];
			qAvg += buffer[i + 1];
		}
		iAvg = iAvg / buffer.length;
		qAvg = qAvg / buffer.length;
		for (let i = 0; i < buffer.length; i+=2) {
			let iv = buffer[i] - iAvg;
			let qv = buffer[i + 1] - qAvg;
			const amplitude = Math.sqrt( iv * iv + qv * qv);
			this.result[i/2] = amplitude;
			sigSum += amplitude;
		}
	    const halfPoint = sigSum / this.result.length;
	    for (let i = 0; i < this.result.length; ++i) {
	      this.result[i] = (this.result[i] - halfPoint) / halfPoint;
	    }
		return this.result; 
	}

}
module.exports = AMDemod;