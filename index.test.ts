import { setTimeout } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import PNext from './index'

class Count {
  num = 0
  increment() {
    return Promise.resolve().then(() => {
      return ++this.num
    })
  }

  decrement() {
    return Promise.resolve().then(() => {
      return --this.num
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

describe('p-next', () => {
  it('proxy once', () => {
    const p = new PNext()
    const countItem = new Count()
    const _increment = countItem.increment
    countItem.increment = p.add(countItem.increment) as any
    expect(countItem.increment).toBe(p.add(_increment))
    expect(countItem.increment).toBe(p.add(countItem.increment))
  })

  it('next exists if auto is false', () => {
    const p = new PNext(false)
    const p_auto = new PNext()

    expect(p.next).toBeTypeOf('function')
    expect(p_auto.next).toBeUndefined()
  })

  it('next manual', async () => {
    const p = new PNext(false)
    const countItem = new Count()
    countItem.increment = p.add(countItem.increment) as any
    const getNumSpy = vi.spyOn(countItem, 'getNum')

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(1)
    })

    countItem.increment().then(async () => {
      expect(await countItem.getNum()).toBe(2)
    })

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(1)

    p.next!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)
  })

  it('nextAll manual', async () => {
    const p = new PNext(false)
    const countItem = new Count()
    countItem.increment = p.add(countItem.increment) as any
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

    p.nextAll!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(3)
  })

  it('next & nextAll', async () => {
    const p = new PNext(false)
    const countItem = new Count()
    countItem.increment = p.add(countItem.increment) as any
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

    p.next!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(2)

    p.nextAll!()

    await setTimeout(100)
    expect(getNumSpy).toHaveBeenCalledTimes(4)
  })

  it('class scope', async () => {
    const p1 = new PNext(false)
    const p2 = new PNext(false)
    const countItem = new Count()
    countItem.increment = p1.add(countItem.increment) as any
    countItem.reset = p2.add(countItem.reset) as any
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
    const p = new PNext()
    const countItem = new Count()
    countItem.increment = p.add(countItem.increment) as any

    countItem.increment().then((res) => {
      expect(res).toBe(1)
    })

    await countItem.increment()
    expect(await countItem.getNum()).toBe(2)
  })

  it('multiple promise', async () => {
    const p = new PNext()
    const countItem = new Count()
    countItem.increment = p.add(countItem.increment) as any
    countItem.decrement = p.add(countItem.decrement) as any
    countItem.reset = p.add(countItem.reset) as any
    countItem.getNum = p.add(countItem.getNum) as any

    // first
    countItem.increment().then((res) => {
      expect(res).toBe(1)

      // second
      countItem.reset().then(async () => {
        const num = await countItem.getNum()
        expect(num).toBe(0)
      })
    })

    // third
    countItem.decrement().then((res) => {
      expect(res).toBe(-1)
    })

    // fourth
    await countItem.reset()
    expect(await countItem.getNum()).toBe(0)
  })
})
