import type { Accessor } from "./types.js";

/**
 * Resolves a layer's `Accessor<T, V>` prop for one datum: calls it if it's a
 * function, returns it as-is otherwise. The single place every painter goes
 * through for visual-prop resolution (the resolution order in docs/architecture.md#theming-and-styling).
 */
export function resolve<T, V>(prop: Accessor<T, V>, d: T, i: number): V {
  return typeof prop === "function" ? (prop as (d: T, i: number) => V)(d, i) : prop;
}
