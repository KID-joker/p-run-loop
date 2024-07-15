# p-loop

`p-loop` providing a controlled way to manage the execution order of promises. It leverages proxies to queue and manage promises, making it easier to handle asynchronous operations sequentially, especially asynchronous third-party dependencies.

## Installation

```
npm install p-loop
```

## Usage

### Importing and Initializing

First, import the `p-loop` class and create an instance of it. You can pass an optional boolean parameter to the constructor to enable or disable automatic promise resolution.

```js
import PLoop from 'p-loop'

const loop = new PLoop() // Auto mode enabled by default
const manualLoop = new PLoop(false) // Auto mode disabled
```

### Adding Asynchronous Functions

To add a function to the loop, use the `add` method. This method returns a proxied version of the function that will be executed according to the loop's rules.

```js
const proxiedFunction = loop.add(originalFunction)
```

### Auto Mode

In auto mode, promises are resolved automatically in the order they were added. This is the default behavior.

```js
const loop = new PLoop()

const fn1 = loop.add(async () => {
  console.log('Function 1')
})

const fn2 = loop.add(async () => {
  console.log('Function 2')
})

fn1()
fn2()
```

In this example, "Function 1" will always be logged before "Function 2", regardless of the individual execution times of the functions.

### Manual Mode

In manual mode, you have control over when the next promise in the queue is resolved by calling the next or nextAll methods.

```js
const loop = new PLoop(false)

const fn1 = loop.add(async () => {
  console.log('Function 1')
})

const fn2 = loop.add(async () => {
  console.log('Function 2')
})

fn1()
fn2()

// Manually resolve the next promise in the queue
loop.next() // Logs: "Function 1"

// Resolve all remaining promises in the queue
loop.nextAll() // Logs: "Function 2"
```

## API

### Constructor

```
constructor(auto?: boolean)
```

- `auto` (optional): A boolean indicating whether promises should be resolved automatically. Defaults to `true`.

### Methods

`add`

```
add(fn: Function): Function
```

- `fn`: The function to be added to the loop.
- Returns: A proxied version of the function.

`next`

```
next(): void
```

Resolves the next promise in the queue. Only available when `auto` is set to `false`.

`nextAll`

```
nextAll(): void
```

Resolves all remaining promises in the queue. Only available when `auto` is set to `false`.

## Example

Here is a complete example demonstrating the usage of `p-loop`:

```js
import PLoop from 'p-loop'

const loop = new PLoop()

const fn1 = loop.add(async () => {
  console.log('Function 1')
  return 'Result 1'
})

const fn2 = loop.add(async () => {
  console.log('Function 2')
  return 'Result 2'
})

fn1().then(result => console.log(result))
fn2().then(result => console.log(result))
```

Output:

```
Function 1
Result 1
Function 2
Result 2
```

In this example, "Function 1" and its result will always be logged before "Function 2" and its result, maintaining the order of execution.

## Credits

Inspired by [p-mutex](https://github.com/sindresorhus/p-mutex)
