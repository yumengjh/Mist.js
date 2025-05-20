`nextTick`的作用是：

1. 将回调函数延迟到下一个 DOM 更新周期之后执行。
2. 将回调函数延迟到下一个事件循环之前执行。


主要是为了延迟执行回调函数，避免在 DOM 更新之前执行回调函数，导致 DOM 更新失败，确保在 DOM 更新后执行。

```js
   // 假设我们直接执行
   state.count++  // 修改响应式数据
   console.log(el.textContent)  // 此时 DOM 还未更新
   
   // 使用 nextTick
   state.count++
   nextTick(() => {
     console.log(el.textContent)  // 此时 DOM 已更新
   })
```

实现原理：

1. 将回调函数存储在一个队列中。
2. 在下一个事件循环中，执行队列中的回调函数。


```js
 // 使用 Promise 创建微任务
   const p = Promise.resolve()
   export const nextTick = (fn: () => void) => p.then(fn)
```

- Promise.resolve() 创建一个已完成的 Promise
- .then() 会将回调函数放入微任务队列
- 微任务会在当前宏任务执行完后，下一个宏任务开始前执行


```js
  console.log(1)  // 同步代码
   
   nextTick(() => {
     console.log(2)  // 微任务
   })
   
   setTimeout(() => {
     console.log(3)  // 宏任务
   })
   
   // 输出顺序：1 -> 2 -> 3
```

在本项目中使用的目的：

- 确保 DOM 更新后再执行回调

使用场景：
```js
   // 在响应式更新后
   effect(() => {
     // 更新 DOM
     el.textContent = state.count
   })
   
   // 需要等待 DOM 更新后执行
   nextTick(() => {
     // 此时可以获取到更新后的 DOM
     console.log(el.textContent)
   })
```




