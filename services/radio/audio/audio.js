const Encoder = require('libopus.js').Encoder;
const Decoder = require('libopus.js').Decoder;
const wavEncoder = require('node-wav');
const fs = require('fs');

class Audio {

	constructor() {
		this.audiorate = 24000;
		this.encoder = new Encoder({rate:this.audiorate, channels: 1, unsafe: true});
		this.decoder = new Decoder({rate:this.audiorate, channels: 1});
		// 10 ms frame_size
		this.frame_size = this.audiorate / 100; 
		// 5s buffer ? 
		this.buffer = new Float32Array(this.audiorate);
		this.bufferOffset = 0;
		// Callabck events
		this.callback = [];
		this.previous = [];
		this.update = false;
	}

	getSamplerate() {
		return this.audiorate;
	}

	setSamplerate(value) {
		console.log('change audio rate to ' + value);
		this.update = true;
		this.audiorate = value;
		this.encoder = new Encoder({rate:this.audiorate, channels: 1, unsafe: true});		
		// 10 ms frame_size
		this.frame_size = value / 100; 
		// 5s buffer ? 
		this.buffer = new Float32Array(value);
		this.bufferOffset = 0;
		this.update = false;
	}

	encode(pcm) {
		if (this.update) {
			return null;
		}
		if (this.bufferOffset + pcm.length <= this.buffer.length) {
			this.buffer.set(pcm, this.bufferOffset);
			this.bufferOffset += pcm.length;
		} else {
			// save to the end of the buffer
			//subarray is safe here as it is only in this submethod
			if (this.buffer.length - this.bufferOffset > 0) {
				this.buffer.set(pcm.subarray(0, this.buffer.length - this.bufferOffset), this.bufferOffset);
				this.bufferOffset += pcm.length
			}
			// Compress 1s frame per frame size then send
			for (let i = 0; i < this.buffer.length; i += this.frame_size) {
				const compressed = this.encoder.encode(this.buffer.subarray(i, i + this.frame_size));
				if (this.callback['complete'] != null) {
					this.callback['complete'](compressed);
				}
			}
			// this.save('./data/test.wav');
			// save remaining data
			if (this.bufferOffset > this.buffer.length) {
				const remaining = this.bufferOffset - this.buffer.length;
				this.buffer.set(pcm.subarray(pcm.length - remaining), 0);
				this.bufferOffset = remaining;
			} else {
				this.bufferOffset = 0;
			}
		}
	}

	save(fileName) {
		let audioData = new Array(1);
		audioData[0] = this.buffer;
		const wavdata = wavEncoder.encode(audioData, {sampleRate: this.audiorate, float:true, bitDepth:32});
		return fs.writeFile(fileName, Buffer.from(wavdata), (err) => {
				if (err) {
					console.log('error :'+err);
				} else {
					console.log('save !');
				}
			});
	}

	on(event, callback) {
		this.callback[event] = callback;
	}

	off(event) {
		this.callback[event] = null;
	}
}

module.exports = Audio;