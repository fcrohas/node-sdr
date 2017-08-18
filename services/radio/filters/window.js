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