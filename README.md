# petite-vue

`petite-vue` 是 [Vue](https://vuejs.org) 的一个替代发行版，专为[渐进式增强](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)优化。它提供了与标准 Vue 相同的模板语法和响应式思维模型。然而，它特别优化了在服务器框架渲染的现有 HTML 页面上"添加"少量交互的场景。更多关于[与标准 Vue 的区别](#comparison-with-standard-vue)的详细信息。

- 仅约 6kb
- Vue 兼容的模板语法
- 基于 DOM，原地修改
- 由 `@vue/reactivity` 驱动

## 项目依赖说明

### 核心依赖

项目在开发时依赖以下包，但在构建后会被打包到最终文件中，用户使用时不需要安装任何依赖：

- `@vue/reactivity`: Vue 3 的响应式系统核心
  - 提供 `reactive`、`effect` 等响应式 API
  - 实现依赖收集和触发更新
  - 是 petite-vue 响应式能力的核心

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

## Windows 环境构建说明

在 Windows 环境下构建时，需要注意以下几点：

1. 构建脚本中的 `mv` 命令需要替换为 Windows 的 `move` 命令：
```json
{
  "scripts": {
    "build": "vite build && tsc --emitDeclarationOnly && move dist\\src dist\\types"
  }
}
```
这个修改解决了 Windows 系统下无法识别 Linux/Unix 的 `mv` 命令的问题。`move` 是 Windows 原生的文件移动命令，可以确保构建脚本在 Windows 环境下正常执行。

2. 如果遇到 TypeScript 类型错误，可以在 `tsconfig.json` 中添加以下配置：
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

3. 如果遇到依赖版本问题，建议使用以下稳定版本：
```json
{
  "devDependencies": {
    "@vue/reactivity": "3.2.45",
    "@vue/shared": "3.2.45"
  }
}
```
固定依赖版本可以：
- 避免因依赖版本不兼容导致的类型错误
- 确保项目在不同环境下的一致性
- 防止因依赖版本自动更新带来的潜在问题

## 状态

- 这是一个相当新的项目。可能存在 bug，API 也可能发生变化，所以**使用风险自负**。不过它是否可用？非常可用。查看[示例](https://github.com/vuejs/petite-vue/tree/main/examples)了解它的功能。

- 问题列表目前是禁用的，因为我现在有更高优先级的事情要关注，不想分心。如果你发现了一个 bug，你需要自己解决或提交 PR 来修复它。不过，你可以使用讨论标签来互相帮助。

- 目前不太可能接受功能请求 - 这个项目的范围被有意保持在最低限度。

## 使用方法

`petite-vue` 可以在没有构建步骤的情况下使用。只需从 CDN 加载：

```html
<script src="https://unpkg.com/petite-vue" defer init></script>

<!-- 页面上的任何位置 -->
<div v-scope="{ count: 0 }">
  {{ count }}
  <button @click="count++">增加</button>
</div>
```

- 使用 `v-scope` 标记页面上应该由 `petite-vue` 控制的区域。
- `defer` 属性使脚本在 HTML 内容解析后执行。
- `init` 属性告诉 `petite-vue` 自动查询并初始化页面上所有带有 `v-scope` 的元素。

### 手动初始化

如果你不想要自动初始化，删除 `init` 属性并将脚本移到 `<body>` 的末尾：

```html
<script src="https://unpkg.com/petite-vue"></script>
<script>
  PetiteVue.createApp().mount()
</script>
```

或者，使用 ES 模块构建：

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'
  createApp().mount()
</script>
```

### 生产环境 CDN URL

简短的 CDN URL 仅用于原型设计。对于生产环境，使用完全解析的 CDN URL 以避免解析和重定向成本：

- 全局构建：`https://unpkg.com/petite-vue@0.2.2/dist/petite-vue.iife.js`
  - 暴露 `PetiteVue` 全局变量，支持自动初始化
- ESM 构建：`https://unpkg.com/petite-vue@0.2.2/dist/petite-vue.es.js`
  - 必须与 `<script type="module">` 一起使用

### 根作用域

`createApp` 函数接受一个数据对象，作为所有表达式的根作用域。这可以用于引导简单的、一次性的应用：

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

  createApp({
    // 暴露给所有表达式
    count: 0,
    // getter
    get plusOne() {
      return this.count + 1
    },
    // 方法
    increment() {
      this.count++
    }
  }).mount()
</script>

<!-- v-scope 值可以省略 -->
<div v-scope>
  <p>{{ count }}</p>
  <p>{{ plusOne }}</p>
  <button @click="increment">增加</button>
</div>
```

注意 `v-scope` 在这里不需要有值，它只是作为 `petite-vue` 处理元素的提示。

### 显式挂载目标

你可以指定一个挂载目标（选择器或元素）来限制 `petite-vue` 只处理页面的特定区域：

```js
createApp().mount('#only-this-div')
```

这也意味着你可以在同一页面上有多个 `petite-vue` 应用来控制不同的区域：

```js
createApp({
  // 应用一的根作用域
}).mount('#app1')

createApp({
  // 应用二的根作用域
}).mount('#app2')
```

### 生命周期事件

你可以监听每个元素的特殊 `vue:mounted` 和 `vue:unmounted` 生命周期事件（从 v0.4.0 开始需要 `vue:` 前缀）：

```html
<div
  v-if="show"
  @vue:mounted="console.log('mounted on: ', $el)"
  @vue:unmounted="console.log('unmounted: ', $el)"
></div>
```

### `v-effect`

使用 `v-effect` 执行**响应式**内联语句：

```html
<div v-scope="{ count: 0 }">
  <div v-effect="$el.textContent = count"></div>
  <button @click="count++">++</button>
</div>
```

这个效果使用了 `count`，它是一个响应式数据源，所以每当 `count` 改变时它都会重新运行。

另一个替换原始 Vue TodoMVC 示例中 `todo-focus` 指令的例子：

```html
<input v-effect="if (todo === editedTodo) $el.focus()" />
```

- 它会自动追踪内部使用的响应式数据

- 当这些数据发生变化时，会自动重新执行语句

- $el 指向当前元素

```js
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

### 组件

"组件"的概念在 `petite-vue` 中是不同的，因为它更加精简。

首先，可以使用函数创建可重用的作用域逻辑：

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

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

### 带模板的组件

如果你还想重用一段模板，你可以在作用域对象上提供一个特殊的 `$template` 键。值可以是模板字符串，或者是 `<template>` 元素的 ID 选择器：

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

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

### 全局状态管理

你可以使用 `reactive` 方法（从 `@vue/reactivity` 重新导出）来创建全局状态单例：

```html
<script type="module">
  import { createApp, reactive } from 'https://unpkg.com/petite-vue?module'

  const store = reactive({
    count: 0,
    inc() {
      this.count++
    }
  })

  // 在这里操作它
  store.inc()

  createApp({
    // 与应用作用域共享
    store
  }).mount()
</script>

<div v-scope="{ localCount: 0 }">
  <p>全局 {{ store.count }}</p>
  <button @click="store.inc">增加</button>

  <p>本地 {{ localCount }}</p>
  <button @click="localCount++">增加</button>
</div>
```

### 自定义指令

也支持自定义指令，但接口不同：

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

这就是 `v-html` 的实现方式：

```js
const html = ({ el, get, effect }) => {
  effect(() => {
    el.innerHTML = get()
  })
}
```

### 自定义分隔符 (0.3+)

你可以通过向根作用域传递 `$delimiters` 来使用自定义分隔符。这在处理同样使用大括号的服务器端模板语言时很有用：

```js
createApp({
  $delimiters: ['${', '}']
}).mount()
```

$delimiters 是 petite-vue 中用于自定义模板分隔符的功能，主要用于解决与**其他模板引擎**的冲突问题。

```html
<script type="module">
  import { createApp } from 'petite-vue'
  
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

使用场景

```html
<!-- 场景1：与 PHP 模板共存 -->
<div v-scope="{ $delimiters: ['${', '}'] }">
  <!-- PHP 使用 <?php ?> -->
  <?php echo $phpVar; ?>
  
  <!-- Vue 使用 ${ } -->
  ${ count }
</div>

<!-- 场景2：与 Handlebars 模板共存 -->
<div v-scope="{ $delimiters: ['[[', ']]'] }">
  <!-- Handlebars 使用 {{ }} -->
  {{ handlebarsVar }}
  
  <!-- Vue 使用 [[ ]] -->
  [[ count ]]
</div>
```

## 示例

查看[示例目录](https://github.com/vuejs/petite-vue/tree/main/examples)。

## 特性

### 仅 `petite-vue` 独有

- `v-scope`
- `v-effect`
- `@vue:mounted` 和 `@vue:unmounted` 事件

### 行为不同

- 在表达式中，`$el` 指向指令绑定的当前元素（而不是组件根元素）
- `createApp()` 接受全局状态而不是组件
- 组件被简化为返回对象的函数
- 自定义指令有不同的接口

### Vue 兼容

- `{{ }}` 文本绑定（可使用自定义分隔符配置）
- `v-bind`（包括 `:` 简写和 class/style 特殊处理）
- `v-on`（包括 `@` 简写和所有修饰符）
- `v-model`（所有输入类型 + 非字符串 `:value` 绑定）
- `v-if` / `v-else` / `v-else-if`
- `v-for`
- `v-show`
- `v-html`
- `v-text`
- `v-pre`
- `v-once`
- `v-cloak`
- `reactive()`
- `nextTick()`
- 模板引用

### 不支持

一些特性被删除是因为它们在渐进式增强的上下文中具有相对较低的实用性/大小比。如果你需要这些特性，你可能应该直接使用标准 Vue。

- `ref()`、`computed()` 等
- 渲染函数（`petite-vue` 没有虚拟 DOM）
- 集合类型的响应式（Map、Set 等，为减小体积而移除）
- Transition、KeepAlive、Teleport、Suspense
- `v-for` 深度解构
- `v-on="object"`
- `v-is` 和 `<component :is="xxx">`
- `v-bind:style` 自动前缀

## 与标准 Vue 的比较

`petite-vue` 的重点不仅仅是体积小。它是关于为预期用例（渐进式增强）使用最佳实现。

标准 Vue 可以在有或没有构建步骤的情况下使用。当使用构建设置（例如使用单文件组件）时，我们预编译所有模板，因此运行时不需要模板处理。由于 tree-shaking，我们可以在标准 Vue 中提供可选特性，这些特性在未使用时不会增加你的包大小。这是标准 Vue 的最佳用法，但由于它涉及构建设置，因此更适合构建 SPA 或具有相对较重交互的应用。

当在没有构建步骤的情况下使用标准 Vue 并挂载到 DOM 模板时，它的效率要低得多，因为：

- 我们必须将 Vue 模板编译器发送到浏览器（额外增加 13kb）
- 编译器必须从已实例化的 DOM 中检索模板字符串
- 编译器然后将字符串编译为 JavaScript 渲染函数
- Vue 然后用从渲染函数生成的新 DOM 替换现有的 DOM 模板。

`petite-vue` 通过遍历现有 DOM 并直接向元素附加细粒度的响应式效果来避免所有这些开销。DOM _就是_ 模板。这意味着 `petite-vue` 在渐进式增强场景中效率要高得多。

这也是 Vue 1 的工作方式。这里的权衡是这种方法与 DOM 耦合，因此不适合平台无关的渲染或 JavaScript SSR。我们还失去了使用渲染函数进行高级抽象的能力。但是你可能可以看出，这些功能在渐进式增强的上下文中很少需要。

## 与 Alpine 的比较

`petite-vue` 确实在解决与 [Alpine](https://alpinejs.dev) 类似的范围，但目标是（1）更加精简和（2）更加 Vue 兼容。

- `petite-vue` 的大小约为 Alpine 的一半。

- `petite-vue` 没有过渡系统（也许这可以是一个可选的插件）。

- 虽然 Alpine 在很大程度上类似于 Vue 的设计，但在各种情况下其行为与 Vue 本身不同。它将来也可能与 Vue 更加不同。这很好，因为 Alpine 不应该限制其设计以严格遵循 Vue - 它应该有自由朝着对其目标有意义的方向发展。

  相比之下，`petite-vue` 将尽可能与标准 Vue 行为保持一致，以便在需要时更容易迁移到标准 Vue。它旨在成为 **Vue 生态系统的一部分**，以覆盖标准 Vue 现在不太优化的渐进式增强用例。

## 安全性和 CSP

`petite-vue` 在模板中评估 JavaScript 表达式。这意味着**如果** `petite-vue` 挂载在包含来自用户数据的未净化 HTML 的 DOM 区域上，可能会导致 XSS 攻击。**如果你的页面渲染用户提交的 HTML，你应该使用[显式挂载目标](#explicit-mount-target)初始化 `petite-vue`，这样它只处理你控制的部分**。你还可以净化 `v-scope` 属性的任何用户提交的 HTML。

`petite-vue` 使用 `new Function()` 评估表达式，这在严格的 CSP 设置中可能被禁止。目前没有计划提供 CSP 构建，因为它涉及发送表达式解析器，这违背了轻量级的目的。如果你有严格的 CSP 要求，你可能应该使用标准 Vue 并预编译模板。

## 许可证

MIT
