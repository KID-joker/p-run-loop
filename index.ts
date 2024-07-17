type PromiseResolve<T> = (value?: T | PromiseLike<T>) => void

function isSymbol(val: unknown): val is symbol {
  return typeof val === 'symbol'
}

export default class PLoop {
  readonly auto: boolean = true
  #queue: PromiseResolve<any>[] = []
  #queuing: boolean = false
  #promising: boolean = false
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
      apply: async (fnTarget, thisArg, argArray) => {
        if (this.#promising)
          return await Reflect.apply(fnTarget, thisArg, argArray)

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

        return this.#proxyPromise(promise)
      },
    })

    this.#proxySet.add(proxyFn)
    this.#proxyMap.set(fn, proxyFn)
    return proxyFn
  }

  #next() {
    this.#promising = false

    if (this.#queue.length > 0) {
      const resolve = this.#queue.shift() as PromiseResolve<any>
      resolve()
    }
    else {
      this.#queuing = false
    }
  }

  #proxyPromise(promise: Promise<any>) {
    return new Proxy(promise, {
      get: (target, p, receiver) => {
        const thenable = Reflect.get(target, p, receiver)
        if (isSymbol(p) || !['then', 'catch', 'finally'].includes(p))
          return thenable

        return (...args: Function[]) => {
          return this.#proxyPromise(Reflect.apply(thenable, target, args.map((fn) => {
            return new Proxy(fn, {
              apply: async (fnTarget, thisArg, argArray) => {
                this.#promising = true
                return await Reflect.apply(fnTarget, thisArg, argArray)
              },
            })
          })))
        }
      },
    })
  }
}
