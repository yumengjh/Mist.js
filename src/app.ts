import { reactive } from '@vue/reactivity' // 响应式
import { Block } from './block' // 块级作用域
import { Directive } from './directives' // 指令
import { bindContextMethods, createContext } from './context' // 上下文
import { toDisplayString } from './directives/text' // 文本指令
import { nextTick } from './scheduler' // 调度器

const escapeRegex = (str: string) =>
  str.replace(/[-.*+?^${}()|[\]\/\\]/g, '\\$&')

export const createApp = (initialData?: any) => {
  // 根上下文
  const ctx = createContext()
  if (initialData) {
    ctx.scope = reactive(initialData)
    bindContextMethods(ctx.scope)

    // 处理自定义分隔符
    if (initialData.$delimiters) {
      const [open, close] = (ctx.delimiters = initialData.$delimiters)
      ctx.delimitersRE = new RegExp(
        escapeRegex(open) + '([^]+?)' + escapeRegex(close),
        'g'
      )
    }
  }

  // 全局内部辅助函数
  ctx.scope.$s = toDisplayString  // 将表达式转换为字符串
  ctx.scope.$nextTick = nextTick  // 调度器
  ctx.scope.$refs = Object.create(null)  // 创建一个空对象

  let rootBlocks: Block[]   // 根块

  return {
    directive(name: string, def?: Directive) {
      if (def) {
        ctx.dirs[name] = def
        return this
      } else {
        return ctx.dirs[name]
      }
    },

    mount(el?: string | Element | null) {
      if (typeof el === 'string') {
        el = document.querySelector(el)
        if (!el) {
          import.meta.env.DEV &&
            console.error(`选择器 ${el} 没有匹配的元素。`)
          return
        }
      }

      el = el || document.documentElement
      let roots: Element[]
      if (el.hasAttribute('v-scope')) {
        roots = [el]
      } else {
        // 只匹配顶层的 v-scope 元素
        roots = [...el.querySelectorAll(`[v-scope]`)].filter(
          (root) => !root.matches(`[v-scope] [v-scope]`)
        )
      }
      // 如果没有任何根元素，则使用整个文档
      if (!roots.length) {
        roots = [el]
      }

      if (
        import.meta.env.DEV &&
        roots.length === 1 &&
        roots[0] === document.documentElement
      ) {
        console.warn(
          `挂载在 documentElement 上 - 这不是最优的，因为 Mist.js ` +
            `将被迫遍历整个页面的 DOM。` +
            `考虑使用 \`v-scope\` 明确标记由 Mist.js 控制的元素。`
        )
      }

      // 创建根块
      rootBlocks = roots.map((el) => new Block(el, ctx, true))
      return this
    },

    unmount() {
      rootBlocks.forEach((block) => block.teardown())
    }
  }
}
