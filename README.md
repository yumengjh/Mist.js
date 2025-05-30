# Mist.js

`Mist.js` 是基于[`Petite-vue`](https://github.com/vuejs/petite-vue)的轻量级框架，专为[渐进式增强](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)优化，它特别优化了在服务器框架渲染的现有 HTML 页面上"添加"少量交互的场景。

- 仅约 17kb，gzip 后约 7kb
- 基于 DOM，原地修改
- 由 `@vue/reactivity` 驱动

## 构建说明

如果遇到 TypeScript 类型错误，可以在 `tsconfig.json` 中添加以下配置：
```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```
这些配置的作用是：
- `skipLibCheck`: 跳过对 node_modules 中类型定义的严格检查，避免第三方库的类型定义问题影响项目构建
- `esModuleInterop`: 改善模块兼容性，使 TypeScript 能够正确处理 CommonJS 和 ES Module 之间的互操作性


##  使用方法

### 引入

#### IIFE
```html
<script src="/path/to/mist.js" defer init></script>
```

- `defer` 表示脚本将在文档解析完成后执行

- `init` 表示脚本将自动查询并初始化页面上所有带有 v-scope 的元素。

IIFE模式下，`Mist.js` 会自动将 `Mist` 挂载到全局对象上，即可以通过 `Mist` 访问到 `Mist.js` 的所有功能。

```js
Mist.createApp()
Mist.nextTick()
Mist.reactive()
```

如果你不想要自动初始化，可以选择手动初始化：
```html
<script>
    Mist.createApp().mount()
</script>
```

#### ES Module
```html
<script type="module">
  import { createApp } from '/path/to/mist.js'
  createApp().mount()
</script>
```

### createApp()

`createApp` 是 `Mist.js` 的入口函数，用于创建一个应用，返回创建的应用实例，可以调用 `mount` 方法挂载到 DOM 上。

该函数接受一个数据对象作为参数，该数据对象中的数据将作为所有表达式的根作用域。

```html
<script type="module">
    import { createApp } from '/path/to/mist.js'
    const app = createApp({
        count: 0
    })
    app.mount()
</script>
```
### mount()

`mount` 是 `createApp` 返回的应用实例的方法，用于指定`Mist.js`应该处理的区域，即限制`Mist.js`的作用域。

该方法接受一个**元素选择器**作为参数，表示将数据对象应用到该元素上，如果不传入参数，它会遍历所有带有 `v-scope` 的元素，并应用数据对象。

注意：如果不传入任何参数，`Mist.js` 会处理整个页面，但是这会带来性能问题，因为将被迫遍历整个页面的 DOM，所以请谨慎使用。

### 生命周期

你可以监听每个元素的特殊 vue:mounted 和 vue:unmounted 生命周期事件，来执行一些自定义操作。

```html
<div
  v-if="show"
  @vue:mounted="console.log('mounted on: ', $el)"
  @vue:unmounted="console.log('unmounted: ', $el)"
></div>
```
### v-effect

使用 v-effect 执行响应式内联语句：

```html
<div v-scope="{ count: 0 }">
  <div v-effect="$el.textContent = count"></div>
  <button @click="count++">++</button>
</div>
```

这个效果使用了 count，它是一个响应式数据源，所以每当 count 改变时它都会重新运行。

- 它会自动追踪内部使用的响应式数据

- 当这些数据发生变化时，会自动重新执行语句

- $el 指向当前元素

```html
<!-- 场景1：自动聚焦 -->
<input v-effect="if (todo === editedTodo) $el.focus()" />

<!-- 场景2：动态样式 -->
<div v-effect="$el.style.color = count > 5 ? 'red' : 'black'">
  {{ count }}
</div>

<!-- 场景3：DOM 操作 -->
<div v-effect="if (isVisible) $el.classList.add('show')">
  内容
</div>
```

### 模板

在`Mist.js`中，可以使用函数创建可重用的作用域逻辑：

```html
<script type="module">
  import { createApp } from '/path/to/mist.js'

  function Counter(props) {
    return {
      count: props.initialCount,
      inc() {
        this.count++
      },
      mounted() {
        console.log(`我已被挂载！`)
      }
    }
  }

  createApp({
    Counter
  }).mount()
</script>

<div v-scope="Counter({ initialCount: 1 })" @vue:mounted="mounted">
  <p>{{ count }}</p>
  <button @click="inc">增加</button>
</div>

<div v-scope="Counter({ initialCount: 2 })">
  <p>{{ count }}</p>
  <button @click="inc">增加</button>
</div>
```

如果你还想重用一段模板，你可以在作用域对象上提供一个特殊的 $template 键。值可以是模板字符串，或者是 `<template>` 元素的 ID 选择器：


```html
<script type="module">
  import { createApp } from '/path/to/mist.js'

  function Counter(props) {
    return {
      $template: '#counter-template',
      count: props.initialCount,
      inc() {
        this.count++
      }
    }
  }

  createApp({
    Counter
  }).mount()
</script>

<template id="counter-template">
  我的计数是 {{ count }}
  <button @click="inc">++</button>
</template>

<!-- 重用它 -->
<div v-scope="Counter({ initialCount: 1 })"></div>
<div v-scope="Counter({ initialCount: 2 })"></div>
```

推荐使用 `<template>` 方法而不是内联字符串，因为从原生模板元素克隆更高效。

### 全局状态

你可以使用 `reactive` 方法来创建全局状态：

```html
<script type="module">
  import { createApp, reactive } from '/path/to/mist.js'

  // 创建全局状态
  const store = reactive({
    count: 0,
    inc() {
      this.count++
    }
  })

  // 在全局作用域中操作它
  store.inc()

  createApp({
    // 与应用作用域共存
    store
  }).mount()
</script>

<div v-scope="{ localCount: 0 }">
  <p>全局 {{ store.count }}</p>
  <button @click="store.inc">增加</button>

  <p>局部 {{ localCount }}</p>
  <button @click="localCount++">增加</button>
</div>
```
### 自定义指令

```js
const myDirective = (ctx) => {
  // 指令所在的元素
  ctx.el
  // 原始值表达式
  // 例如 v-my-dir="x" 那么这里就是 "x"
  ctx.exp
  // v-my-dir:foo -> "foo"
  ctx.arg
  // v-my-dir.mod -> { mod: true }
  ctx.modifiers
  // 计算表达式并获取其值
  ctx.get()
  // 在当前作用域中计算任意表达式
  ctx.get(`${ctx.exp} + 10`)

  // 运行响应式效果
  ctx.effect(() => {
    // 每当 get() 值改变时都会重新运行
    console.log(ctx.get())
  })

  return () => {
    // 如果元素被卸载则清理
  }
}

// 注册指令
createApp().directive('my-dir', myDirective).mount()
```

指令`html`的实现方式：

```js
const html = ({ el, get, effect }) => {
  effect(() => {
    el.innerHTML = get()
  })
}
```

### 自定义分隔符  

`$delimiters` 是 `Mist.js` 中用于自定义模板分隔符的功能，通过向**作用域**传递该配置，可以灵活设置模板语法中的分隔符，这在处理同样使用大括号的服务器端模板语言时特别有用，能有效避免与其他模板引擎的语法冲突。

```js
createApp({
  $delimiters: ['${', '}']
}).mount()
```

例子：

```html
<script type="module">
  import { createApp } from '/path/to/mist.js'
  
  createApp({
    // 自定义分隔符为 ${ } 格式
    $delimiters: ['${', '}'],
    count: 0
  }).mount()
</script>

<div v-scope>
  <!-- 使用自定义分隔符 -->
  <p>计数: ${ count }</p>
  <button @click="count++">增加</button>
</div>
```
使用场景：

```html
<!-- 场景1：与 PHP 模板共存 -->
<div v-scope="{ $delimiters: ['${', '}'] }">
  <!-- PHP 使用 <?php ?> -->
  <?php echo $phpVar; ?>
  
  <!-- Mist.js 使用 ${ } -->
  ${ count }
</div>

<!-- 场景2：与 Handlebars 模板共存 -->
<div v-scope="{ $delimiters: ['[[', ']]'] }">
  <!-- Handlebars 使用 {{ }} -->
  {{ handlebarsVar }}
  
  <!-- Mist.js 使用 [[ ]] -->
  [[ count ]]
</div>
```

### 插值语法

在元素中使用**插值语法** `{{ }}` 进行渲染数据，`{{ }}` 中的内容会被计算为 JavaScript 表达式，所以可以在其中使用任意合法的 JavaScript 表达式（可使用自定义分隔符配置）。

```html
<div v-scope="{ count: 0 }">
  <p>{{ count }}</p>
</div>
```


### v-bind

包括 : 简写和 class/style 特殊处理

### v-on

包括 @ 简写和所有修饰符

### v-model

所有输入类型 + 非字符串 :value 绑定

### v-if / v-else / v-else-if

### v-for

### v-show

### v-html

### v-text

### v-pre

### v-once

### v-cloak

### reactive()

### nextTick()


### 表达式

#### $el

`$el` 指向指令绑定的当前元素

## 安全性和 CSP

`Mist.js` 在模板中计算 JavaScript 表达式。这意味着如果 `Mist.js` 挂载在包含来自用户数据的未净化 HTML 的 DOM 区域上，可能会导致 XSS 攻击。如果你的页面渲染用户提交的 HTML，你应该使用**显式挂载目标**初始化 `Mist.js`，这样它只处理你控制的部分。你还可以净化 v-scope 属性的任何用户提交的 HTML。

`Mist.js` 使用 `new Function()` 计算表达式，这在严格的 CSP 设置中可能被禁止。目前没有计划提供 CSP 构建，因为它涉及发送表达式解析器，这违背了轻量级的目的。如果你有严格的 CSP 要求，你可能应该使用标准 Vue 并预编译模板。


## 许可证

MIT


## 项目依赖说明

### 核心依赖

项目在开发时依赖以下包，但在构建后会被打包到最终文件中，用户使用时不需要安装任何依赖：

- `@vue/reactivity`: Vue 3 的响应式系统核心
  - 提供 `reactive`、`effect` 等响应式 API
  - 实现依赖收集和触发更新
  - 是 Mist.js 响应式能力的核心

- `@vue/shared`: Vue 3 的共享工具函数
  - 提供通用的工具函数
  - 包含类型检查、字符串处理等
  - 减少重复代码

### 开发依赖

- `typescript`: TypeScript 支持
  - 提供类型检查
  - 改善开发体验
  - 提供更好的代码提示

- `vite`: 构建工具
  - 提供开发服务器
  - 处理构建过程
  - 支持热更新

- `prettier`: 代码格式化
  - 统一代码风格
  - 自动格式化代码

- `chalk`: 终端颜色输出
  - 美化命令行输出
  - 提供更好的开发体验

- `conventional-changelog-cli`: 生成更新日志
  - 自动生成 CHANGELOG
  - 规范化版本更新记录

- `enquirer`: 交互式命令行工具
  - 提供命令行交互
  - 用于发布流程

- `execa`: 执行命令
  - 跨平台执行命令
  - 用于构建和发布脚本

- `semver`: 语义化版本
  - 处理版本号
  - 版本比较和验证