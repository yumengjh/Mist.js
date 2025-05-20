# Petite Vue 开发指南

## 1. 项目概述

Petite Vue 是一个轻量级的 Vue 子集，专注于渐进式增强。它保留了 Vue 的核心功能，同时大大减少了体积。这个项目非常适合：

- 学习 Vue 的核心原理
- 理解响应式系统的工作原理
- 开发自己的框架或库
- 在现有项目中添加交互功能

## 2. 学习路线

### 2.1 底层核心实现

1. **响应式系统核心**
   - `@vue/reactivity` 包的使用
   - `reactive` 和 `effect` 的实现原理
   - 依赖收集和触发更新的底层机制

2. **调度器实现**
   - `scheduler.ts` 中的任务调度机制
   - 更新队列的管理
   - 异步更新的处理

3. **表达式求值**
   - `eval.ts` 中的表达式解析
   - 作用域链的处理
   - 变量查找机制

### 2.2 中间层实现

1. **块级作用域**
   - `block.ts` 中的 Block 实现
   - 响应式更新的触发机制
   - 作用域隔离的实现

2. **上下文管理**
   - `context.ts` 中的上下文处理
   - 作用域链的维护
   - 变量查找的实现

3. **DOM 遍历和更新**
   - `walk.ts` 中的 DOM 操作
   - 节点遍历算法
   - 更新策略的实现

### 2.3 上层功能实现

1. **指令系统**
   - `directives/` 目录下的指令实现
   - 指令的生命周期
   - 自定义指令的开发

2. **应用创建和挂载**
   - `app.ts` 中的应用初始化
   - 挂载过程
   - 实例管理

## 3. 项目结构

```
src/
├── app.ts          # 应用创建和挂载
├── block.ts        # 块级作用域管理
├── context.ts      # 上下文管理
├── directives/     # 指令实现
├── eval.ts         # 表达式求值
├── scheduler.ts    # 调度器
├── utils.ts        # 工具函数
└── walk.ts         # DOM 遍历
```

## 3.1 源码阅读顺序推荐

### 第一阶段：响应式系统
1. **scheduler.ts**
   - 了解任务调度机制
   - 理解更新队列的实现
   - 掌握异步更新的处理方式

2. **block.ts**
   - 研究 Block 类的实现
   - 理解响应式更新的触发机制
   - 学习作用域隔离的实现方式

3. **context.ts**
   - 了解上下文管理
   - 研究作用域链的维护
   - 掌握变量查找的实现

### 第二阶段：模板处理
1. **eval.ts**
   - 研究表达式求值
   - 理解作用域链的处理
   - 学习变量查找机制

2. **walk.ts**
   - 了解 DOM 遍历算法
   - 研究节点更新策略
   - 掌握 DOM 操作优化

### 第三阶段：功能实现
1. **directives/**
   - 研究内置指令实现
   - 理解指令生命周期
   - 学习自定义指令开发

2. **app.ts**
   - 了解应用创建过程
   - 研究挂载机制
   - 掌握实例管理

### 第四阶段：工具函数
1. **utils.ts**
   - 研究通用工具函数
   - 理解辅助方法实现
   - 学习代码复用技巧

### 阅读建议
1. **每个文件的阅读顺序**：
   - 先看类型定义和接口
   - 再看核心方法实现
   - 最后看辅助函数

2. **重点关注**：
   - 函数之间的调用关系
   - 数据流转过程
   - 状态管理方式

3. **调试技巧**：
   - 使用断点调试
   - 添加日志输出
   - 跟踪函数调用栈

4. **实践方法**：
   - 尝试修改源码
   - 添加新功能
   - 优化现有实现

## 4. 核心 API 详解

### 4.1 响应式系统 API

```typescript
// 创建响应式对象
const state = reactive({ count: 0 })

// 创建计算属性
const doubled = computed(() => state.count * 2)

// 创建副作用
effect(() => {
  console.log(state.count)
})
```

### 4.2 Block API

```typescript
// 创建响应式块
const block = new Block(() => {
  // 块内代码
})

// 手动触发更新
block.update()
```

### 4.3 指令 API

```typescript
// 指令定义
const myDirective: Directive = {
  beforeMount(el, binding) {
    // 挂载前
  },
  mounted(el, binding) {
    // 挂载后
  },
  beforeUpdate(el, binding) {
    // 更新前
  },
  updated(el, binding) {
    // 更新后
  }
}
```

## 5. 实战应用

### 5.1 基础功能实现

1. **响应式数据绑定**
   ```typescript
   // 创建响应式数据
   const state = reactive({
     count: 0,
     increment() {
       this.count++
     }
   })
   ```

2. **计算属性**
   ```typescript
   // 创建计算属性
   const computed = computed(() => {
     return state.count * 2
   })
   ```

3. **监听器**
   ```typescript
   // 创建监听器
   watch(() => state.count, (newVal, oldVal) => {
     console.log('count changed:', newVal, oldVal)
   })
   ```

### 5.2 高级功能实现

1. **自定义指令**
   ```typescript
   // 实现自定义指令
   const vMyDirective: Directive = {
     mounted(el, binding) {
       // 实现指令逻辑
     }
   }
   ```

2. **组件系统**
   ```typescript
   // 创建组件
   const MyComponent = {
     props: ['title'],
     setup(props) {
       // 组件逻辑
     }
   }
   ```

## 6. 调试技巧

1. **响应式调试**
   ```typescript
   // 开启调试模式
   if (import.meta.env.DEV) {
     // 添加调试日志
     effect(() => {
       console.log('effect triggered:', state.count)
     })
   }
   ```

2. **性能分析**
   - 使用 Performance 面板
   - 监控内存使用
   - 分析更新性能

## 7. 进阶主题

1. **自定义编译器**
   - 实现模板预编译
   - 添加新的语法特性
   - 优化编译性能

2. **插件系统**
   - 设计插件接口
   - 实现插件生命周期
   - 管理插件依赖

## 8. 资源推荐

1. **核心文档**
   - [@vue/reactivity 文档](https://github.com/vuejs/vue-next/tree/master/packages/reactivity)
   - [Vue 3 响应式系统](https://v3.vuejs.org/guide/reactivity.html)

2. **源码阅读**
   - [@vue/reactivity 源码](https://github.com/vuejs/vue-next/tree/master/packages/reactivity)
   - [Vue 3 源码](https://github.com/vuejs/vue-next)

## 9. 常见问题

1. **响应式问题**
   - 响应式数据不更新
   - 计算属性缓存
   - 副作用清理

2. **性能问题**
   - 更新性能优化
   - 内存泄漏处理
   - 大量数据渲染

## 10. 未来展望

1. **计划功能**
   - 路由系统
   - 状态管理
   - 组件系统

2. **优化方向**
   - 性能优化
   - 体积优化
   - 开发体验
