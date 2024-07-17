import { setTimeout } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import PLoop from './index'

class Count {
  num = 0
  increment() {
    return Promise.resolve().then(() => {
      return ++this.num
    })
  }

  reset() {
    return Promise.resolve().then(() => {
      this.num = 0
    })
  }

  getNum() {
    return Promise.resolve().then(() => {
      return this.num
    })
  }
}

describe('p-run-loop', () => {
  it('proxy once', () => {
    const loop = new PLoop()
    const counter = new Count()
    const _increment = counter.increment
    counter.increment = loop.add(counter.increment) as any
    expect(counter.increment).toBe(loop.add(_increment))
    expect(counter.increment).toBe(loop.add(counter.increment))
  })

  it('next exists if auto is false', () => {
    const loop = new PLoop(false)
    const loop_auto = new PLoop()

    expect(loop.next).toBeTypeOf('function')
    expect(loop_auto.next).toBeUndefined()
  })

  it('next manual', async () => {
    const loop = new PLoop(false)
    const counter = new Count()
    counter.increment = loop.add(counter.increment) as any
    const getNumSpy = vi.spyOn(counter, 'getNum')

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(1)
    })

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(2)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(1)

    loop.next!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)
  })

  it('nextAll manual', async () => {
    const loop = new PLoop(false)
    const counter = new Count()
    counter.increment = loop.add(counter.increment) as any
    const getNumSpy = vi.spyOn(counter, 'getNum')

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(1)
    })

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(3)
    })

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(3)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(1)

    loop.nextAll!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(3)
  })

  it('next & nextAll', async () => {
    const loop = new PLoop(false)
    const counter = new Count()
    counter.increment = loop.add(counter.increment) as any
    const getNumSpy = vi.spyOn(counter, 'getNum')

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(1)
    })

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(2)
    })

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(4)
    })

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(4)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(1)

    loop.next!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)

    loop.nextAll!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(4)
  })

  it('class scope', async () => {
    const loop1 = new PLoop(false)
    const loop2 = new PLoop(false)
    const counter = new Count()
    counter.increment = loop1.add(counter.increment) as any
    counter.reset = loop2.add(counter.reset) as any
    const getNumSpy = vi.spyOn(counter, 'getNum')

    counter.increment().then(async () => {
      expect(await counter.getNum()).toBe(0)
    })

    counter.reset().then(async () => {
      expect(await counter.getNum()).toBe(0)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)
  })

  it('single promise', async () => {
    const loop = new PLoop()
    const counter = new Count()
    counter.increment = loop.add(counter.increment) as any

    counter.increment().then((res) => {
      expect(res).toBe(1)
    })

    await counter.increment()
    expect(await counter.getNum()).toBe(2)
  })

  it('multiple promise', async () => {
    const loop = new PLoop()
    const counter = new Count()
    counter.increment = loop.add(counter.increment) as any
    counter.getNum = loop.add(counter.getNum) as any

    // first
    counter.increment().then((res) => {
      expect(res).toBe(1)

      // second
      counter.increment().then(async (res) => {
        expect(res).toBe(2)

        // third
        await counter.increment()

        // fourth
        const num = await counter.getNum()
        expect(num).toBe(3)
      })
    })

    // fifth
    counter.increment().then(async (res) => {
      expect(res).toBe(4)

      // sixth
      await counter.increment()

      // seventh
      const num = await counter.getNum()
      expect(num).toBe(5)

      return num
    }).then((res) => {
      // eighth
      expect(res).toBe(5)
    })

    // ninth
    expect(await counter.getNum()).toBe(5)

    // tenth
    await counter.reset()
    counter.getNum().then((res) => {
      expect(res).toBe(0)
    })
  })
})
