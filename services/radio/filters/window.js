class Window {
	constructor(size) {
		this.window = new Float32Array(size);
	}

	static baseWindow(i, N, A, B, C, D) {
		return A - B*Math.cos(2*Math.PI*i/(N-1)) +C*Math.cos(4*Math.PI*i/(N-1))-D*Math.cos(6*Math.PI*i/(N-1));
	}

	static hamming(i, N)
	{
		return Window.baseWindow(i, N, 0.54, 0.46, 0, 0);
	}

	static hann(i, N)
	{
		return Window.baseWindow(i, N, 0, 0.5, 0, 0);
	}

	static blackman(i, N)
	{
		return Window.baseWindow(i, N, 0.426591, 0.496561, 0.076848, 0);
	}

	static blackmanharris(i, N)
	{
		return Window.baseWindow(i, N, 0.35875, 0.48829, 0.14128, 0.01168);
	}

	static rectangle(i, N)
	{
	    return Window.baseWindow(i, N, 1.0, 0, 0, 0);
	}

	factorial(n)
	{
	  return (n == 1 || n == 0) ? 1 : this.factorial(n - 1) * n;
	}

	bessel(x)
	{
	    // Bessel zero order approx
	    let i0 = 0.0;
	    for (let k=1; k<21; k++) {
	        i0 += Math.pow(Math.pow(x/2,k)/this.factorial(k),2);
	    }
	    i0 += 1.0;
	    return i0;
	}

	kaiser(attenuation, frequency, width, samplerate)
	{

	    let beta = 0.0;
	    let M = 0.0;
	    let N = 0;
	    let wdelta = 2*Math.PI*(frequency+width/2.0)/samplerate - 2*Math.PI*(frequency-width/2.0)/samplerate;
	    if ((attenuation !=0.0) && (width!=0.0)) {
	        N = (attenuation - 8.0) / (4.57 * wdelta) + 1.0;
	        // Update windows size according to params
	        this.window = new Float32Array(N);
	        M=(N-1)/2;
	    }
	    //  beta from aa value
	    if ( attenuation < 21.0) beta =0.0;
	    if (( attenuation>=21.0) && (attenuation<=50.0)) beta = 0.5842*Math.pow((attenuation-21.0),0.4)+0.07886*(attenuation-21.0);
	    if (attenuation>50.0) beta = 0.1102*(attenuation-8.7);
	    // Windowing function
	    for (let n=0; n<N; n++) {
	        this.window[n] = this.bessel(beta*Math.sqrt(1.0-Math.pow((n-M)/M,2)))/this.bessel(beta);
	    }
	    return N;
	}

	build(windowFunc) {
		const N = this.window.length;
		for (let i = 0; i < N; i++) {
			this.window[i] = windowFunc(i, N);
		}
	}

	get() {
		return this.window;
	}

}

module.exports = Window;
