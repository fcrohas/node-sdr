let sleep = require('thread-sleep');
let fs = require('fs');
let wavreader = require('node-wav');
let buffer = fs.readFileSync('./data/AM_IQ.wav');
let result = wavreader.decode(buffer);	
console.log('Reading wav file at rate='+result.sampleRate+' length='+result.channelData[0].length);			
let interleavedArr = new Float32Array(result.channelData[0].length * 2);			
// Prepare interleave data
let c = 0;
const chunkIQ = 16 * 16384;
const chunkIQ2 = 8 * 16384;
for (let i = 0; i < result.channelData[0].length; i += chunkIQ2) {
	const chunkI = result.channelData[0].subarray(i, i + chunkIQ2);
	const chunkQ = result.channelData[1].subarray(i, i + chunkIQ2);
	for (let j = 0; j < chunkIQ2; j++) {
		interleavedArr[c] = chunkI[j];
		interleavedArr[c + 1] = chunkQ[j];
		c+=2;
	}
}
let i = 0;
// Rouding length

const newlength = Math.round( interleavedArr.length / chunkIQ) * chunkIQ;
setInterval( () => {
	if (i + chunkIQ <= newlength) {
		process.send({data: interleavedArr.subarray(i, i + chunkIQ), length: chunkIQ});					
		i += chunkIQ;
	} else {
		i = 0;
	}
},63);
