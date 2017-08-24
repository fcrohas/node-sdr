const Encoder = require('libopus.js').Encoder;
const wavEncoder = require('node-wav');

class Audio {
	constructor() {
		this.audiorate = 24000;
		this.encoder = new Encoder({rate:this.audiorate, channels: 1});
		// 10 ms frame_size
		this.frame_size = (this.audiorate / 100); 
		// 5s buffer ? 
		this.buffer = new Float32Array(1/0.01 * this.frame_size * 5);
		this.bufferSize = 0;
		// Callabck events
		this.callback = [];
		// 
	}

	encode(pcm) {
		if (this.bufferSize + pcm.length < this.buffer.length) {
			this.buffer.set(pcm, this.bufferSize);
			this.bufferSize += pcm.length;
		} else {
			// Compress 5s frames
			for (let i=0; i<this.buffer.length; i+=this.frame_size) {
				const compressed = this.encoder.encode(this.buffer.subarray(i, i + this.frame_size));
			}
			// callback with compressed data
			//this.callback['complete']()
			// reset buffer to 0
			this.bufferSize = pcm.length;
			this.buffer.set(pcm);
		}
	}

	save(fileName) {
		let audioData = new Array(1);
		audioData[0] = this.buffer;
		const wavdata = wavEncoder.encode(audioData, {sampleRate:22050, float:true, bitDepth:32});
		return fs.writeFile(fileName, Buffer.from(wavdata));
	}

	register(event, callback) {
		this.callback[event] = callback;
	}
}

module.exports = Audio;