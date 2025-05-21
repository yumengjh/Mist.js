# Petite-Vue walk 模块解析

`walk.ts` 是 Petite-Vue 的核心模块之一，负责遍历和解析 DOM 树，处理各种指令和模板语法。它是模板编译的核心，负责将模板转换为响应式的 DOM 操作。

## 导入的模块

从各个模块导入的功能：

### 1. 指令相关
```typescript
import { builtInDirectives, Directive } from './directives'
import { _if } from './directives/if'
import { _for } from './directives/for'
import { bind } from './directives/bind'
import { on } from './directives/on'
import { text } from './directives/text'
import { ref } from './directives/ref'
```
- `builtInDirectives`: 内置指令集合
- `Directive`: 指令类型定义
- `_if`: 条件渲染指令
- `_for`: 列表渲染指令
- `bind`: 属性绑定指令
- `on`: 事件绑定指令
- `text`: 文本插值指令
- `ref`: 引用指令

### 2. 工具函数
```typescript
import { evaluate } from './eval'
import { checkAttr } from './utils'
```
- `evaluate`: 表达式求值函数
- `checkAttr`: 属性检查函数

### 3. 上下文相关
```typescript
import { Context, createScopedContext } from './context'
```
- `Context`: 上下文类型定义
- `createScopedContext`: 创建作用域上下文

## 核心常量

### 1. 指令正则
```typescript
const dirRE = /^(?:v-|:|@)/
```
用于匹配指令前缀：
- `v-`: 标准指令前缀
- `:`: v-bind 简写
- `@`: v-on 简写

### 2. 修饰符正则
```typescript
const modifierRE = /\.([\w-]+)/g
```
用于匹配指令修饰符，如：
- `v-bind:class.camel`
- `v-on:click.stop`

### 3. 全局标记
```typescript
export let inOnce = false
```
用于 `v-once` 指令的状态标记

## walk 函数实现

### 1. 函数定义
```typescript
export const walk = (node: Node, ctx: Context): ChildNode | null | void => {
  const type = node.nodeType
  // ...
}
```

参数说明：
- `node`: 要遍历的 DOM 节点
- `ctx`: 当前上下文对象
- 返回值：处理后的子节点或 null

### 2. 节点类型处理

#### 2.1 元素节点 (type === 1)
```typescript
if (type === 1) {
  const el = node as Element
  
  // 处理 v-pre
  if (el.hasAttribute('v-pre')) return
  
  // 处理 v-cloak
  checkAttr(el, 'v-cloak')
  
  // 处理 v-if
  if ((exp = checkAttr(el, 'v-if'))) {
    return _if(el, exp, ctx)
  }
  
  // 处理 v-for
  if ((exp = checkAttr(el, 'v-for'))) {
    return _for(el, exp, ctx)
  }
  
  // 处理 v-scope
  if ((exp = checkAttr(el, 'v-scope')) || exp === '') {
    const scope = exp ? evaluate(ctx.scope, exp) : {}
    ctx = createScopedContext(ctx, scope)
    if (scope.$template) {
      resolveTemplate(el, scope.$template)
    }
  }
  
  // 处理 v-once
  const hasVOnce = checkAttr(el, 'v-once') != null
  if (hasVOnce) {
    inOnce = true
  }
  
  // 处理 ref
  if ((exp = checkAttr(el, 'ref'))) {
    applyDirective(el, ref, `"${exp}"`, ctx)
  }
  
  // 处理子节点
  walkChildren(el, ctx)
  
  // 处理其他指令
  const deferred: [string, string][] = []
  for (const { name, value } of [...el.attributes]) {
    if (dirRE.test(name) && name !== 'v-cloak') {
      if (name === 'v-model') {
        // 延迟处理 v-model，因为它依赖于 :value 绑定先被处理
        deferred.unshift([name, value])
      } else if (name[0] === '@' || /^v-on\b/.test(name)) {
        deferred.push([name, value])
      } else {
        processDirective(el, name, value, ctx)
      }
    }
  }
  for (const [name, value] of deferred) {
    processDirective(el, name, value, ctx)
  }

  if (hasVOnce) {
    inOnce = false
  }
}
```

#### 2.2 文本节点 (type === 3)
```typescript
else if (type === 3) {
  const data = (node as Text).data
  if (data.includes(ctx.delimiters[0])) {
    // 处理文本插值
    let segments: string[] = []
    let lastIndex = 0
    let match
    while ((match = ctx.delimitersRE.exec(data))) {
      const leading = data.slice(lastIndex, match.index)
      if (leading) segments.push(JSON.stringify(leading))
      segments.push(`$s(${match[1]})`)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < data.length) {
      segments.push(JSON.stringify(data.slice(lastIndex)))
    }
    applyDirective(node, text, segments.join('+'), ctx)
  }
}
```

#### 2.3 文档片段 (type === 11)
```typescript
else if (type === 11) {
  walkChildren(node as DocumentFragment, ctx)
}
```

## 辅助函数

### 1. walkChildren
```typescript
const walkChildren = (node: Element | DocumentFragment, ctx: Context) => {
  let child = node.firstChild
  while (child) {
    child = walk(child, ctx) || child.nextSibling
  }
}
```
功能：
- 遍历节点的所有子节点
- 对每个子节点应用 walk 函数
- 处理节点替换和删除

### 2. processDirective
```typescript
const processDirective = (
  el: Element,
  raw: string,
  exp: string,
  ctx: Context
) => {
  // 提取修饰符
  let modifiers: Record<string, true> | undefined
  raw = raw.replace(modifierRE, (_, m) => {
    (modifiers || (modifiers = {}))[m] = true
    return ''
  })

  // 确定指令类型
  let dir: Directive
  let arg: string | undefined

  if (raw[0] === ':') {
    dir = bind
    arg = raw.slice(1)
  } else if (raw[0] === '@') {
    dir = on
    arg = raw.slice(1)
  } else {
    const argIndex = raw.indexOf(':')
    const dirName = argIndex > 0 ? raw.slice(2, argIndex) : raw.slice(2)
    dir = builtInDirectives[dirName] || ctx.dirs[dirName]
    arg = argIndex > 0 ? raw.slice(argIndex + 1) : undefined
  }

  // 应用指令
  if (dir) {
    if (dir === bind && arg === 'ref') dir = ref
    applyDirective(el, dir, exp, ctx, arg, modifiers)
    el.removeAttribute(raw)
  } else if (import.meta.env.DEV) {
    console.error(`未知的自定义指令 ${raw}。`)
  }
}
```

### 3. applyDirective
```typescript
const applyDirective = (
  el: Node,
  dir: Directive<any>,
  exp: string,
  ctx: Context,
  arg?: string,
  modifiers?: Record<string, true>
) => {
  const get = (e = exp) => evaluate(ctx.scope, e, el)
  const cleanup = dir({
    el,
    get,
    effect: ctx.effect,
    ctx,
    exp,
    arg,
    modifiers
  })
  if (cleanup) {
    ctx.cleanups.push(cleanup)
  }
}
```

### 4. resolveTemplate
```typescript
const resolveTemplate = (el: Element, template: string) => {
  if (template[0] === '#') {
    const templateEl = document.querySelector(template)
    if (import.meta.env.DEV && !templateEl) {
      console.error(
        `模板选择器 ${template} 没有匹配的 <template> 元素。`
      )
    }
    el.appendChild((templateEl as HTMLTemplateElement).content.cloneNode(true))
    return
  }
  el.innerHTML = template
}
```

## 使用示例

### 1. 基本用法
```html
<div v-scope="{ count: 0 }">
  <p v-if="count > 0">Count is positive</p>
  <p v-for="item in items">{{ item }}</p>
  <button @click="count++">Increment</button>
</div>
```

### 2. 指令处理
```html
<!-- v-bind 指令 -->
<div :class="{ active: isActive }"></div>

<!-- v-on 指令 -->
<button @click="handleClick"></button>

<!-- v-model 指令 -->
<input v-model="message">

<!-- 自定义指令 -->
<div v-custom="value"></div>
```

### 3. 模板使用
```html
<!-- 使用模板 -->
<template id="my-template">
  <div class="template-content">
    {{ message }}
  </div>
</template>

<div v-scope="{ $template: '#my-template', message: 'Hello' }"></div>
```

## 注意事项

1. 指令优先级
   - `v-pre` > `v-cloak` > `v-if` > `v-for` > `v-scope` > `v-once` > `ref` > 其他指令
   - `v-model` 需要延迟处理
   - `v-on` 需要最后处理

2. 性能优化
   - 使用 `v-once` 优化静态内容
   - 合理使用 `v-if` 和 `v-show`
   - 避免深层嵌套的 `v-for`
   - 注意指令处理顺序

3. 作用域处理
   - `v-scope` 创建新的作用域
   - 子作用域可以访问父作用域
   - 注意作用域隔离
   - 模板作用域的特殊处理

4. 错误处理
   - 开发环境下的错误提示
   - 未知指令的处理
   - 模板解析错误处理
   - 模板选择器错误处理

5. 调试技巧
   - 使用 `v-cloak` 处理闪烁
   - 开发环境下的错误提示
   - 合理使用 `v-pre`
   - 注意指令执行顺序

## 最佳实践

1. 指令使用
   - 优先使用内置指令
   - 合理使用修饰符
   - 避免指令冲突
   - 注意指令优先级

2. 性能优化
   - 使用 `v-once` 处理静态内容
   - 合理使用 `v-if` 和 `v-show`
   - 避免不必要的响应式
   - 注意指令处理顺序

3. 代码组织
   - 保持模板简洁
   - 合理使用作用域
   - 注意指令优先级
   - 使用模板复用代码

4. 调试技巧
   - 使用 `v-cloak` 处理闪烁
   - 开发环境下的错误提示
   - 合理使用 `v-pre`
   - 注意指令执行顺序
