# Petite-Vue bind 指令解析

## 导入的工具函数

从 `@vue/shared` 导入的工具函数及其用途：

### 1. normalizeClass
```typescript
normalizeClass(value: any): string
```
用于规范化 class 值的工具函数：
- 处理字符串、数组、对象等多种 class 值格式
- 将各种格式统一转换为字符串
- 自动处理空格和重复值
- 支持对象形式的条件类名

示例：
```typescript
normalizeClass('foo') // 'foo'
normalizeClass(['foo', 'bar']) // 'foo bar'
normalizeClass({ foo: true, bar: false }) // 'foo'
```

### 2. normalizeStyle
```typescript
normalizeStyle(value: any): string | Record<string, string>
```
用于规范化 style 值的工具函数：
- 处理字符串、对象形式的样式
- 自动添加单位（如 px）
- 处理驼峰命名转换
- 支持数组形式的样式值

示例：
```typescript
normalizeStyle('color: red') // 'color: red'
normalizeStyle({ color: 'red', fontSize: '14px' }) // { color: 'red', 'font-size': '14px' }
```

### 3. isString
```typescript
isString(value: any): value is string
```
类型守卫函数：
- 判断值是否为字符串类型
- 用于运行时类型检查
- 帮助 TypeScript 进行类型推断

### 4. isArray
```typescript
isArray(value: any): value is any[]
```
类型守卫函数：
- 判断值是否为数组类型
- 用于运行时类型检查
- 帮助 TypeScript 进行类型推断

### 5. hyphenate
```typescript
hyphenate(str: string): string
```
将驼峰命名转换为连字符命名：
- 用于 CSS 属性名的转换
- 处理 DOM 属性到 CSS 属性的映射

示例：
```typescript
hyphenate('fontSize') // 'font-size'
hyphenate('backgroundColor') // 'background-color'
```

### 6. camelize	
```typescript
camelize(str: string): string
```
将连字符命名转换为驼峰命名：
- 用于 CSS 属性名到 DOM 属性的转换
- 处理 HTML 属性到 JavaScript 属性的映射

示例：
```typescript
camelize('font-size') // 'fontSize'
camelize('background-color') // 'backgroundColor'
```

## bind 指令实现

### 1. 指令定义
```typescript
export const bind: Directive<Element & { _class?: string }> = ({
  el,
  get,
  effect,
  arg,
  modifiers
}) => {
  // ...
}
```

参数说明：
- `el`: 绑定的 DOM 元素
- `get`: 获取绑定值的函数
- `effect`: 创建响应式副作用的函数
- `arg`: 指令的参数（如 v-bind:class 中的 class）
- `modifiers`: 指令的修饰符对象

### 2. 核心功能

#### 2.1 类名处理
```typescript
if (arg === 'class') {
  el._class = el.className
}
```
- 记录元素的静态类名
- 用于后续动态类名的合并

#### 2.2 属性设置
```typescript
setProp(el, key, value, prevValue)
```
处理不同类型的属性：
1. class 属性
   - 合并静态和动态类名
   - 使用 normalizeClass 规范化

2. style 属性
   - 处理字符串和对象形式的样式
   - 支持 !important
   - 处理自定义属性（CSS 变量）

3. 普通属性
   - 优先使用 DOM 属性
   - 特殊情况使用 setAttribute
   - 处理特殊属性（如 value）

### 3. 样式处理

#### 3.1 样式设置函数
```typescript
const setStyle = (
  style: CSSStyleDeclaration,
  name: string,
  val: string | string[]
) => {
  // ...
}
```

功能：
- 处理数组形式的样式值
- 支持 CSS 自定义属性
- 处理 !important 标记
- 自动转换属性名格式

#### 3.2 特殊处理
- 处理 CSS 变量（以 -- 开头的属性）
- 处理 !important 标记
- 处理数组形式的样式值

## 使用示例

### 1. 类名绑定
```html
<div v-bind:class="{ active: isActive }"></div>
<div v-bind:class="['foo', { bar: isBar }]"></div>
```

### 2. 样式绑定
```html
<div v-bind:style="{ color: activeColor, fontSize: size + 'px' }"></div>
<div v-bind:style="[baseStyles, overridingStyles]"></div>
```

### 3. 属性绑定
```html
<img v-bind:src="imageSrc">
<input v-bind:value="inputValue">
```

## 注意事项

1. 性能优化
   - 使用 prevValue 避免不必要的更新
   - 优先使用 DOM 属性而不是 setAttribute

2. 特殊属性处理
   - 处理 value 等特殊属性
   - 处理 true-value/false-value 等特殊情况

3. 类型安全
   - 使用 TypeScript 类型守卫
   - 处理可能的空值情况

4. 兼容性
   - 处理 SVG 元素的特殊情况
   - 处理不同浏览器的差异 