import {
  effect as rawEffect,
  reactive,
  ReactiveEffectRunner
} from '@vue/reactivity'
import { Block } from './block'
import { Directive } from './directives'
import { queueJob } from './scheduler'
import { inOnce } from './walk'
import { hasOwn } from './utils'
export interface Context {
  key?: any
  scope: Record<string, any>
  dirs: Record<string, Directive>
  blocks: Block[]
  effect: typeof rawEffect
  effects: ReactiveEffectRunner[]
  cleanups: (() => void)[]
  delimiters: [string, string]
  delimitersRE: RegExp
}

export const createContext = (parent?: Context): Context => {
  const ctx: Context = {
    delimiters: ['{{', '}}'],
    delimitersRE: /\{\{([^]+?)\}\}/g,
    ...parent,
    scope: parent ? parent.scope : reactive({}),
    dirs: parent ? parent.dirs : {},
    effects: [],
    blocks: [],
    cleanups: [],
    effect: (fn) => {
      if (inOnce) {
        queueJob(fn)
        return fn as any
      }
      const e: ReactiveEffectRunner = rawEffect(fn, {
        scheduler: () => queueJob(e)
      })
      ctx.effects.push(e)
      return e
    }
  }
  return ctx
}

export const createScopedContext = (ctx: Context, data = {}): Context => {
  const parentScope = ctx.scope
  const mergedScope = Object.create(parentScope)
  Object.defineProperties(mergedScope, Object.getOwnPropertyDescriptors(data))
  mergedScope.$refs = Object.create(parentScope.$refs)
  const reactiveProxy = reactive(
    new Proxy(mergedScope, {
      set(target, key, val, receiver) {
        // 当设置一个在当前作用域中不存在的属性时，
        // 不要在当前作用域中创建它，而是回退到父作用域。
        if (receiver === reactiveProxy && !hasOwn(target, key)) {
          return Reflect.set(parentScope, key, val)
        }
        return Reflect.set(target, key, val, receiver)
      }
    })
  )

  bindContextMethods(reactiveProxy)
  return {
    ...ctx,
    scope: reactiveProxy
  }
}

export const bindContextMethods = (scope: Record<string, any>) => {
  for (const key of Object.keys(scope)) {
    if (typeof scope[key] === 'function') {
      scope[key] = scope[key].bind(scope)
    }
  }
}
