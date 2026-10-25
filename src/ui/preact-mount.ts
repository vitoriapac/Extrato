import { render as preactRender, type ComponentChild } from 'preact';

/**
 * Mounts or reconciles a Preact virtual DOM tree into a container element.
 *
 * @param vnode The Preact component or virtual node to render.
 * @param container The DOM container element.
 */
export function mountPreact(vnode: ComponentChild, container: Element): void {
  preactRender(vnode, container);
}

/**
 * Unmounts any active Preact component tree from a container element.
 *
 * @param container The DOM container element to unmount.
 */
export function unmountPreact(container: Element): void {
  preactRender(null, container);
}
