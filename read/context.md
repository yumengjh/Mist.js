# Petite-Vue Context 模块分析

## 1. 核心概念

### 1.1 Context 接口
```typescript
interface Context {
  key?: any                    // 上下文唯一标识
  scope: Record<string, any>   // 作用域数据
  dirs: Record<string, Directive> // 指令集合
  blocks: Block[]              // 块级作用域
  effect: typeof rawEffect     // 响应式效果函数
  effects: ReactiveEffectRunner[] // 响应式效果运行器集合
  cleanups: (() => void)[]    // 清理函数集合
  delimiters: [string, string] // 模板分隔符
  delimitersRE: RegExp        // 模板分隔符正则
}
```

### 1.2 createContext 参数机制
```typescript
export const createContext = (parent?: Context): Context => {
  // parent 参数是可选的父级上下文
  // 当提供 parent 时，新上下文会继承父上下文的大部分属性
  // 但会创建新的 scope、dirs、effects、blocks 和 cleanups
}
```

#### 参数继承机制：
1. **完全继承的属性**：
   - 通过 `...parent` 展开运算符继承父上下文的所有属性
   - 包括 `key`、`delimiters`、`delimitersRE` 等基础配置

2. **有条件继承的属性**：
   - `scope`: 如果有父上下文，使用父作用域；否则创建新的响应式对象
   - `dirs`: 如果有父上下文，使用父指令集；否则创建新的空对象

3. **始终新建的属性**：
   - `effects`: 新的效果数组
   - `blocks`: 新的块数组
   - `cleanups`: 新的清理函数数组
   - `effect`: 新的效果函数

#### 使用场景：
1. **创建根上下文**：
```typescript
const rootCtx = createContext() // 不传参数，创建全新的上下文
```

2. **创建子上下文**：
```typescript
const childCtx = createContext(parentCtx) // 传入父上下文，创建继承的上下文
```

3. **自定义配置**：
```typescript
const customCtx = createContext({
  delimiters: ['[[', ']]'], // 自定义分隔符
  delimitersRE: /\[\[([^]+?)\]\]/g // 自定义正则
})
```

## 2. 主要功能

### 2.1 创建上下文 (createContext)
```typescript
export const createContext = (parent?: Context): Context => {
  const ctx: Context = {
    delimiters: ['{{', '}}'],  // 默认分隔符
    delimitersRE: /\{\{([^]+?)\}\}/g,  // 默认正则
    ...parent,                 // 继承父上下文
    scope: parent ? parent.scope : reactive({}), // 创建响应式作用域
    dirs: parent ? parent.dirs : {},    // 指令集合
    effects: [],               // 效果集合
    blocks: [],               // 块集合
    cleanups: [],             // 清理函数集合
    effect: (fn) => {         // 自定义 effect 函数
      if (inOnce) {
        queueJob(fn)
        return fn as any
      }
      const e = rawEffect(fn, {
        scheduler: () => queueJob(e)
      })
      ctx.effects.push(e)
      return e
    }
  }
  return ctx
}
```

### 2.2 创建作用域上下文 (createScopedContext)
```typescript
export const createScopedContext = (ctx: Context, data = {}): Context => {
  const parentScope = ctx.scope
  // 创建原型链继承的作用域
  const mergedScope = Object.create(parentScope)
  // 合并数据属性
  Object.defineProperties(mergedScope, Object.getOwnPropertyDescriptors(data))
  // 创建引用对象
  mergedScope.$refs = Object.create(parentScope.$refs)
  
  // 创建响应式代理
  const reactiveProxy = reactive(
    new Proxy(mergedScope, {
      set(target, key, val, receiver) {
        // 属性提升：当设置不存在的属性时，提升到父作用域
        if (receiver === reactiveProxy && !target.hasOwnProperty(key)) {
          return Reflect.set(parentScope, key, val)
        }
        return Reflect.set(target, key, val)
      }
    })
  )

  bindContextMethods(reactiveProxy)
  return {
    ...ctx,
    scope: reactiveProxy
  }
}
```

### 2.3 绑定上下文方法 (bindContextMethods)
```typescript
export const bindContextMethods = (scope: Record<string, any>) => {
  // 绑定所有方法到当前作用域
  for (const key of Object.keys(scope)) {
    if (typeof scope[key] === 'function') {
      scope[key] = scope[key].bind(scope)
    }
  }
}
```

## 3. 执行流程

1. **初始化阶段**
   - 通过 `createContext` 创建根上下文
   - 设置默认分隔符和正则表达式
   - 初始化响应式作用域和指令集合

2. **作用域创建**
   - 使用 `createScopedContext` 创建子作用域
   - 建立原型链继承关系
   - 创建响应式代理
   - 实现属性提升机制

3. **方法绑定**
   - 通过 `bindContextMethods` 绑定方法到作用域
   - 确保方法执行时的 this 指向正确

4. **响应式处理**
   - 使用 Vue 的响应式系统
   - 通过 effect 函数创建响应式效果
   - 使用调度器管理更新队列

## 4. 关键特性

### 4.1 作用域继承
- 使用原型链实现作用域继承
- 子作用域可以访问父作用域的属性
- 通过属性提升机制实现动态属性继承

### 4.2 响应式系统
- 基于 Vue 的响应式系统
- 支持自动依赖收集
- 使用调度器优化更新性能

### 4.3 方法绑定
- 自动绑定方法到正确的作用域
- 确保方法执行时的上下文正确
- 支持原型链上的方法继承

## 5. 使用示例

```typescript
// 创建根上下文
const rootCtx = createContext()

// 创建子作用域
const childCtx = createScopedContext(rootCtx, {
  message: 'Hello',
  sayHello() {
    console.log(this.message)
  }
})

// 使用响应式效果
childCtx.effect(() => {
  console.log(childCtx.scope.message)
})
```

## 6. 注意事项

1. 作用域创建时要注意原型链的正确性
2. 响应式效果要注意清理，避免内存泄漏
3. 方法绑定要考虑 this 指向问题
4. 属性提升机制可能影响性能，需要合理使用

## 7. createContext 中的属性处理

### 7.1 两种属性添加方式的区别

在 `createContext` 函数中，有两种方式可以添加属性到上下文：

1. **通过参数传递**：
```typescript
const ctx = createContext({
  delimiters: ['[[', ']]'],
  delimitersRE: /\[\[([^]+?)\]\]/g
})
```

2. **通过点运算符添加**：
```typescript
const ctx = createContext()
ctx.scope = reactive({})
ctx.dirs = {}
```

#### 主要区别：

1. **属性覆盖机制**：
   - 参数传递：通过 `...parent` 展开运算符，子属性会覆盖父属性
   - 点运算符：直接修改对象，完全替换原有属性

2. **响应式处理**：
   - 参数传递：`scope` 属性会自动通过 `reactive` 处理
   - 点运算符：需要手动调用 `reactive` 处理

3. **继承关系**：
   - 参数传递：可以继承父上下文的所有属性
   - 点运算符：会破坏原有的继承关系

4. **初始化时机**：
   - 参数传递：在上下文创建时就完成初始化
   - 点运算符：可以在任何时候动态修改

### 7.2 使用建议

1. **使用参数传递的场景**：
   - 创建新的上下文时设置初始属性
   - 需要继承父上下文属性时
   - 需要保持响应式特性时

2. **使用点运算符的场景**：
   - 动态修改特定属性
   - 完全替换某个属性
   - 调试和测试时

### 7.3 代码示例

```typescript
// 1. 通过参数传递
const parentCtx = createContext({
  delimiters: ['{{', '}}']
})

const childCtx = createContext(parentCtx) // 继承父上下文属性

// 2. 通过点运算符
const ctx = createContext()
ctx.scope = reactive({ count: 0 }) // 直接修改属性
```

### 7.4 注意事项

1. 参数传递会保持响应式特性，而点运算符需要手动处理
2. 使用点运算符修改 `scope` 时，需要确保调用 `reactive`
3. 点运算符会破坏继承关系，使用时需要谨慎
4. 建议优先使用参数传递方式，除非有特殊需求
