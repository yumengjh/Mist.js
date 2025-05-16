import { builtInDirectives, Directive } from './directives'
import { _if } from './directives/if'
import { _for } from './directives/for'
import { bind } from './directives/bind'
import { on } from './directives/on'
import { text } from './directives/text'
import { evaluate } from './eval'
import { checkAttr } from './utils'
import { ref } from './directives/ref'
import { Context, createScopedContext } from './context'

const dirRE = /^(?:v-|:|@)/
const modifierRE = /\.([\w-]+)/g

export let inOnce = false

export const walk = (node: Node, ctx: Context): ChildNode | null | void => {
  const type = node.nodeType
  if (type === 1) {
    // 元素节点
    const el = node as Element
    if (el.hasAttribute('v-pre')) {
      return
    }

    checkAttr(el, 'v-cloak')

    let exp: string | null

    // v-if
    if ((exp = checkAttr(el, 'v-if'))) {
      return _if(el, exp, ctx)
    }

    // v-for
    if ((exp = checkAttr(el, 'v-for'))) {
      return _for(el, exp, ctx)
    }

    // v-scope
    if ((exp = checkAttr(el, 'v-scope')) || exp === '') {
      const scope = exp ? evaluate(ctx.scope, exp) : {}
      ctx = createScopedContext(ctx, scope)
      if (scope.$template) {
        resolveTemplate(el, scope.$template)
      }
    }

    // v-once
    const hasVOnce = checkAttr(el, 'v-once') != null
    if (hasVOnce) {
      inOnce = true
    }

    // ref
    if ((exp = checkAttr(el, 'ref'))) {
      applyDirective(el, ref, `"${exp}"`, ctx)
    }

    // 先处理子节点，再处理自身属性
    walkChildren(el, ctx)

    // 其他指令
    const deferred: [string, string][] = []
    for (const { name, value } of [...el.attributes]) {
      if (dirRE.test(name) && name !== 'v-cloak') {
        if (name === 'v-model') {
          // 延迟处理 v-model，因为它依赖于 :value 绑定先被处理
          // 但要在 v-on 监听器之前处理 (#73)
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
  } else if (type === 3) {
    // 文本节点
    const data = (node as Text).data
    if (data.includes(ctx.delimiters[0])) {
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
  } else if (type === 11) {
    walkChildren(node as DocumentFragment, ctx)
  }
}

const walkChildren = (node: Element | DocumentFragment, ctx: Context) => {
  let child = node.firstChild
  while (child) {
    child = walk(child, ctx) || child.nextSibling
  }
}

const processDirective = (
  el: Element,
  raw: string,
  exp: string,
  ctx: Context
) => {
  let dir: Directive
  let arg: string | undefined
  let modifiers: Record<string, true> | undefined

  // 修饰符
  raw = raw.replace(modifierRE, (_, m) => {
    ;(modifiers || (modifiers = {}))[m] = true
    return ''
  })

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
  if (dir) {
    if (dir === bind && arg === 'ref') dir = ref
    applyDirective(el, dir, exp, ctx, arg, modifiers)
    el.removeAttribute(raw)
  } else if (import.meta.env.DEV) {
    console.error(`未知的自定义指令 ${raw}。`)
  }
}

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
