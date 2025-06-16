export const checkAttr = (el: Element, name: string): string | null => {
  const val = el.getAttribute(name)
  if (val != null) el.removeAttribute(name)
  return val
}

export const listen = (
  el: Element,
  event: string,
  handler: any,
  options?: any
) => {
  el.addEventListener(event, handler, options)
}

export const hasOwn = (obj: object, key: string | symbol) => 
  Object.prototype.hasOwnProperty.call(obj, key)