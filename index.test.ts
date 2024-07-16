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

describe('p-loop', () => {
  it('proxy once', () => {
    const loop = new PLoop()
    const countItem = new Count()
    const _increment = countItem.increment
    countItem.increment = loop.add(countItem.increment) as any
    expect(countItem.increment).toBe(loop.add(_increment))
    expect(countItem.increment).toBe(loop.add(countItem.increment))
  })

  it('next exists if auto is false', () => {
    const loop = new PLoop(false)
    const loop_auto = new PLoop()

    expect(loop.next).toBeTypeOf('function')
    expect(loop_auto.next).toBeUndefined()
  })

  it('next manual', async () => {
    const loop = new PLoop(false)
    const countItem = new Count()
    countItem.increment = loop.add(countItem.increment) as any
    const getNumSpy = vi.spyOn(countItem, 'getNum')

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(1)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(2)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(1)

    loop.next!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)
  })

  it('nextAll manual', async () => {
    const loop = new PLoop(false)
    const countItem = new Count()
    countItem.increment = loop.add(countItem.increment) as any
    const getNumSpy = vi.spyOn(countItem, 'getNum')

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(1)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(3)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(3)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(1)

    loop.nextAll!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(3)
  })

  it('next & nextAll', async () => {
    const loop = new PLoop(false)
    const countItem = new Count()
    countItem.increment = loop.add(countItem.increment) as any
    const getNumSpy = vi.spyOn(countItem, 'getNum')

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(1)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(2)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(4)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(4)
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
    const countItem = new Count()
    countItem.increment = loop1.add(countItem.increment) as any
    countItem.reset = loop2.add(countItem.reset) as any
    const getNumSpy = vi.spyOn(countItem, 'getNum')

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(0)
    })

    countItem.reset().then(async () => {
      expect(await countItem.getNum()).toBe(0)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)
  })

  it('single promise', async () => {
    const loop = new PLoop()
    const countItem = new Count()
    countItem.increment = loop.add(countItem.increment) as any

    countItem.increment().then((res) => {
      expect(res).toBe(1)
    })

    await countItem.increment()
    expect(await countItem.getNum()).toBe(2)
  })

  it('multiple promise', async () => {
    const loop = new PLoop()
    const countItem = new Count()
    countItem.increment = loop.add(countItem.increment) as any
    countItem.getNum = loop.add(countItem.getNum) as any

    // first
    countItem.increment().then((res) => {
      expect(res).toBe(1)

      // fourth
      countItem.increment().then(async (res) => {
        expect(res).toBe(4)
        // sixth
        const num = await countItem.getNum()
        expect(num).toBe(4)
      })
    })

    // second
    countItem.increment().then((res) => {
      expect(res).toBe(2)
    })

    // third
    await countItem.increment()

    // fifth
    expect(await countItem.getNum()).toBe(4)

    // seventh
    countItem.increment().then((res) => {
      expect(res).toBe(5)
    })
  })
})
