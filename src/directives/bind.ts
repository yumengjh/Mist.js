import { Directive } from '.'
import {
  normalizeClass,
  normalizeStyle,
  isString,
  isArray,
  hyphenate,
  camelize
} from '@vue/shared'

const forceAttrRE = /^(spellcheck|draggable|form|list|type)$/

export const bind: Directive<Element & { _class?: string }> = ({
  el,
  get,
  effect,
  arg,
  modifiers
}) => {
  let prevValue: any

  // 记录静态类名
  if (arg === 'class') {
    el._class = el.className
  }

  effect(() => {
    let value = get()
    if (arg) {
      if (modifiers?.camel) {
        arg = camelize(arg)
      }
      setProp(el, arg, value, prevValue)
    } else {
      for (const key in value) {
        setProp(el, key, value[key], prevValue && prevValue[key])
      }
      for (const key in prevValue) {
        if (!value || !(key in value)) {
          setProp(el, key, null)
        }
      }
    }
    prevValue = value
  })
}

const setProp = (
  el: Element & { _class?: string },
  key: string,
  value: any,
  prevValue?: any
) => {
  if (key === 'class') {
    el.setAttribute(
      'class',
      normalizeClass(el._class ? [el._class, value] : value) || ''
    )
  } else if (key === 'style') {
    value = normalizeStyle(value)
    const { style } = el as HTMLElement
    if (!value) {
      el.removeAttribute('style')
    } else if (isString(value)) {
      if (value !== prevValue) style.cssText = value
    } else {
      for (const key in value) {
        setStyle(style, key, value[key])
      }
      if (prevValue && !isString(prevValue)) {
        for (const key in prevValue) {
          if (value[key] == null) {
            setStyle(style, key, '')
          }
        }
      }
    }
  } else if (
    !(el instanceof SVGElement) &&
    key in el &&
    !forceAttrRE.test(key)
  ) {
    // @ts-ignore
    el[key] = value
    if (key === 'value') {
      // @ts-ignore
      el._value = value
    }
  } else {
    // 特殊情况：<input v-model type="checkbox"> 带有
    // :true-value 和 :false-value
    // 将值存储为 DOM 属性，因为非字符串值会被
    // 转换为字符串
    if (key === 'true-value') {
      ;(el as any)._trueValue = value
    } else if (key === 'false-value') {
      ;(el as any)._falseValue = value
    } else if (value != null) {
      el.setAttribute(key, value)
    } else {
      el.removeAttribute(key)
    }
  }
}

const importantRE = /\s*!important$/

const setStyle = (
  style: CSSStyleDeclaration,
  name: string,
  val: string | string[]
) => {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v))
  } else {
    if (name.startsWith('--')) {
      // 自定义属性定义
      style.setProperty(name, val)
    } else {
      if (importantRE.test(val)) {
        // !important
        style.setProperty(
          hyphenate(name),
          val.replace(importantRE, ''),
          'important'
        )
      } else {
        style[name as any] = val
      }
    }
  }
}
