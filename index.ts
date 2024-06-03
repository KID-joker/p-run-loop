type PromiseResolve<T> = (value?: T | PromiseLike<T>) => void
export type PromiseOnFulfilled<T, TResult> =
  | ((value: T) => TResult | PromiseLike<TResult>)
  | undefined
  | null

export type PromiseOnRejected<TResult> =
  | ((reason: any) => TResult | PromiseLike<TResult>)
  | undefined
  | null

export type PromiseOnFinally = (() => void) | undefined | null

type PromiseMethods = 'then' | 'catch' | 'finally'

interface PromiseCallback {
  property: PromiseMethods
  args: any[]
  thisArgument: any
}

const proxySet: WeakSet<Function> = new WeakSet()
const proxyMap: WeakMap<Function, Function> = new WeakMap()

export default class PNext {
  readonly auto: boolean = true
  #queue: PromiseResolve<any>[] = []
  #queuing: boolean = false
  #promising: boolean = false
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
    if (proxySet.has(fn))
      return fn

    let proxyFn = proxyMap.get(fn)
    if (proxyFn)
      return proxyFn

    proxyFn = new Proxy(fn, {
      apply: (fnTarget, thisArg, argArray) => {
        if (this.#promising)
          return Reflect.apply(fnTarget, thisArg, argArray)

        let promise
        const promiseCallbacks: PromiseCallback[] = []
        if (this.#queuing) {
          promise = new Promise((resolve: PromiseResolve<any>) => {
            this.#queue.push(resolve)
          }).then(() => Reflect.apply(fnTarget, thisArg, argArray))
        }
        else {
          this.#queuing = true
          promise = Promise.resolve(Reflect.apply(fnTarget, thisArg, argArray))
        }

        promise
          .then((res) => {
            return this.#createThenable([null, res], promiseCallbacks)
          })
          .catch((err) => {
            return this.#createThenable([err, null], promiseCallbacks)
          })

        return new Proxy(promise, {
          get(promiseTarget, property, receiver) {
            if (
              typeof property === 'string'
              && ['then', 'catch', 'finally'].includes(property)
            ) {
              return function (...args: any[]) {
                promiseCallbacks.push({
                  property: property as PromiseMethods,
                  args,
                  thisArgument: promiseTarget,
                })
                return receiver
              }
            }
            return Reflect.get(promiseTarget, property, receiver)
          },
        })
      },
    })

    proxySet.add(proxyFn)
    proxyMap.set(fn, proxyFn)
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

  async #createThenable(result: any[], promiseCallbacks: PromiseCallback[]) {
    this.#promising = true

    let value, error
    try {
      value = await this.#createPromise(result, promiseCallbacks)
    }
    catch (err: any) {
      error = err
    }

    this.#promising = false
    if (this.auto)
      this.#next()

    return error ? Promise.reject(error) : Promise.resolve(value)
  }

  #createPromise([error, value]: any[], callbacks: PromiseCallback[]) {
    let p = error ? Promise.reject(error) : Promise.resolve(value)
    while (callbacks.length > 0) {
      const { property, args, thisArgument }
        = callbacks.shift() as PromiseCallback
      p = Reflect.apply(Reflect.get(p, property), thisArgument, args)
    }
    return p
  }
}
