# p-scheduler

`p-scheduler` providing a controlled way to manage the execution order of promises. It leverages proxies to queue and manage promises, making it easier to handle asynchronous operations sequentially, especially asynchronous third-party dependencies.

## Installation

```
npm install p-scheduler
```

## Usage

### Importing and Initializing

First, import the `p-scheduler` class and create an instance of it. You can pass an optional boolean parameter to the constructor to enable or disable automatic promise resolution.

```typescript
import PScheduler from 'p-scheduler'

const scheduler = new PScheduler() // Auto mode enabled by default
const manualScheduler = new PScheduler(false) // Auto mode disabled
```

### Adding Asynchronous Functions

To add a function to the scheduler, use the `add` method. This method returns a proxied version of the function that will be executed according to the scheduler's rules.

```typescript
const proxiedFunction = scheduler.add(originalFunction)
```

### Auto Mode

In auto mode, promises are resolved automatically in the order they were added. This is the default behavior.

```typescript
const scheduler = new PScheduler()

const fn1 = scheduler.add(async () => {
  console.log('Function 1')
})

const fn2 = scheduler.add(async () => {
  console.log('Function 2')
})

fn1()
fn2()
```

In this example, "Function 1" will always be logged before "Function 2", regardless of the individual execution times of the functions.

### Manual Mode

In manual mode, you have control over when the next promise in the queue is resolved by calling the next or nextAll methods.

```typescript
const scheduler = new PScheduler(false)

const fn1 = scheduler.add(async () => {
  console.log('Function 1')
})

const fn2 = scheduler.add(async () => {
  console.log('Function 2')
})

fn1()
fn2()

// Manually resolve the next promise in the queue
scheduler.next() // Logs: "Function 1"

// Resolve all remaining promises in the queue
scheduler.nextAll() // Logs: "Function 2"
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

- `fn`: The function to be added to the scheduler.
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

Here is a complete example demonstrating the usage of `p-scheduler`:

```typescript
import PScheduler from 'p-scheduler'

const scheduler = new PScheduler()

const fn1 = scheduler.add(async () => {
  console.log('Function 1')
  return 'Result 1'
})

const fn2 = scheduler.add(async () => {
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
