type PromiseResolve<T> = (value?: T | PromiseLike<T>) => void

export default class PLoop {
  readonly auto: boolean = true
  #queue: PromiseResolve<any>[] = []
  #queuing: boolean = false
  #proxySet: WeakSet<Function> = new WeakSet()
  #proxyMap: WeakMap<Function, Function> = new WeakMap()
  next?: Function
  nextAll?: Function

  constructor(auto?: boolean) {
    if (typeof auto === 'boolean')
      this.auto = auto

    if (!this.auto) {
      this.next = this.#next
      this.nextAll = () => {
        while (this.#queuing) this.#next()
      }
    }
  }

  add(fn: Function) {
    if (this.#proxySet.has(fn))
      return fn

    let proxyFn = this.#proxyMap.get(fn)
    if (proxyFn)
      return proxyFn

    proxyFn = new Proxy(fn, {
      apply: (fnTarget, thisArg, argArray) => {
        let promise
        if (this.#queuing) {
          promise = new Promise((resolve: PromiseResolve<any>) => {
            this.#queue.push(resolve)
          }).then(() => Reflect.apply(fnTarget, thisArg, argArray))
        }
        else {
          this.#queuing = true
          promise = Promise.resolve(Reflect.apply(fnTarget, thisArg, argArray))
        }

        if (this.auto) {
          promise.finally(() => {
            setTimeout(() => {
              this.#next()
            }, 0)
          })
        }

        return promise
      },
    })

    this.#proxySet.add(proxyFn)
    this.#proxyMap.set(fn, proxyFn)
    return proxyFn
  }

  #next() {
    if (this.#queue.length > 0) {
      const resolve = this.#queue.shift() as PromiseResolve<any>
      resolve()
    }
    else {
      this.#queuing = false
    }
  }
}
