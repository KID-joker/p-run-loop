export default class PNext {
	#queue: Function[] = [];
	#map: WeakMap<Function, unknown> = new WeakMap();
	#queuing: Boolean = false;

	add(fn: Function) {
		let p = this.#map.get(fn);
		if (p) {
			return p;
		}
		p = new Proxy(fn, {
			apply: (target, thisArg, argArray) => {
				if (this.#queuing) {
					return new Promise((resolve) => {
						this.#queue.push(resolve);
					}).then(() => Reflect.apply(target, thisArg, argArray));
				} else {
					this.#queuing = true;
					return Reflect.apply(target, thisArg, argArray);
				}
			},
		});
		this.#map.set(fn, p);
		return p;
	}

	next() {
		if (this.#queue.length > 0) {
			const resolve = this.#queue.shift();
			resolve!();
		} else {
			this.#queuing = false;
		}
	}
}
