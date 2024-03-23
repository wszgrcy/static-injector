/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export function deepForEach<T>(
  input: (T | any[])[],
  fn: (value: T) => void,
): void {
  input.forEach((value) =>
    Array.isArray(value) ? deepForEach(value, fn) : fn(value),
  );
}

export function newArray<T = any>(size: number): T[];
export function newArray<T>(size: number, value: T): T[];
export function newArray<T>(size: number, value?: T): T[] {
  const list: T[] = [];
  for (let i = 0; i < size; i++) {
    list.push(value!);
  }
  return list;
}

/**
 * `KeyValueArray` is an array where even positions contain keys and odd positions contain values.
 *
 * `KeyValueArray` provides a very efficient way of iterating over its contents. For small
 * sets (~10) the cost of binary searching an `KeyValueArray` has about the same performance
 * characteristics that of a `Map` with significantly better memory footprint.
 *
 * If used as a `Map` the keys are stored in alphabetical order so that they can be binary searched
 * for retrieval.
 *
 * See: `keyValueArraySet`, `keyValueArrayGet`, `keyValueArrayIndexOf`, `keyValueArrayDelete`.
 */
export interface KeyValueArray<VALUE> extends Array<VALUE | string> {
  __brand__: 'array-map';
}
