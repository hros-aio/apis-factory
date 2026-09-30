// Key checking
export type WithNonNull<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type RequireKeys<T, K extends keyof T> = Prettify<Omit<T, K> & Required<Pick<T, K>>>;

export type OptionalKeys<T, K extends keyof T> = Prettify<Omit<T, K> & Partial<Pick<T, K>>>;

export type NullableKeys<T, K extends keyof T> = Prettify<Omit<T, K> & { [P in K]: T[P] | null }>;

// Filter by value
export type KeysOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export type PickByType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
export type OmitByType<T, V> = { [K in keyof T as T[K] extends V ? never : K]: T[K] };

// Deep checking
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type DeepNonNullable<T> = T extends (infer U)[]
  ? DeepNonNullable<NonNullable<U>>[]
  : T extends object
    ? { [K in keyof T]-?: DeepNonNullable<NonNullable<T[K]>> }
    : NonNullable<T>;

export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// Union
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

// Path
export type Paths<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object ? K | `${K}.${Paths<T[K]>}` : K }[keyof T &
      string]
  : never;

export type PathValue<T, P extends string> = P extends `${infer H}.${infer R}`
  ? H extends keyof T
    ? PathValue<T[H], R>
    : never
  : P extends keyof T
    ? T[P]
    : never;

function get<T, P extends Paths<T>>(obj: T, path: P): PathValue<T, P> {
  return path.split('.').reduce((acc: any, k) => acc?.[k], obj);
}
