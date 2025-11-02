/**
 * An Option type representing either a value (Some) or no value (None).
 * This is a Rust-inspired type for handling optional values safely without null/undefined.
 * Used throughout the codebase for optional configuration values and query parameters.
 *
 * @template T - The type of the value that may or may not be present
 */
export class Option<T> {
  /** Indicates whether this Option contains a value */
  is_some: boolean
  /** The wrapped value, if is_some is true */
  value:T|undefined

  /**
   * Constructs a new Option. Use static methods Some() and None() instead of calling directly.
   *
   * @param arg - The value to store (for Some options)
   * @param is_some - Whether this Option contains a value
   */
  constructor(arg:T|undefined,is_some:boolean) {
    this.is_some = is_some;
    this.value = arg;
  }

  /**
   * Creates an Option containing the given value.
   * Used throughout the codebase when a value is present.
   *
   * @template T - The type of the value
   * @param arg - The value to wrap
   * @returns An Option containing the value
   */
  static Some<T>(arg:T):Option<T> {
    return new Option(arg,true)
  }

  /**
   * Creates an Option representing no value.
   * Used throughout the codebase when a value is absent.
   *
   * @template T - The type of value that would be present
   * @returns An Option containing no value
   */
  static None<T>():Option<T> {
    return new Option(undefined,false);
  }

  /**
   * Chains operations that return Options. If this Option is Some, applies the function.
   * If this Option is None, returns None without calling the function.
   * Used for sequential operations on optional values.
   *
   * @template U - The type of the new value
   * @param f - Function to apply to the contained value
   * @returns A new Option from the function, or None
   */
  andThen<U>(f:(arg:T)=>Option<U>):Option<U> {
    if(this.is_some) {
      return f(this.value);
    } else {
      return Option.None();
    }
  }

  /**
   * Transforms the contained value using the given function.
   * If this Option is None, returns None unchanged.
   * Used to transform optional values while preserving the optional nature.
   *
   * @template U - The type of the transformed value
   * @param f - Function to transform the contained value
   * @returns A new Option with the transformed value or None
   */
  map<U>(f:(arg:T)=>U):Option<U> {
    return this.andThen((a)=>Option.Some(f(a)))
  }

  /**
   * Returns the contained value if Some, otherwise returns the provided default.
   * Used to extract values with a fallback when None doesn't need special handling.
   *
   * @param v - The default value to return if this Option is None
   * @returns The contained value or the default
   */
  unwrapOr(v:T):T {
    if(this.is_some) {
      return this.value;
    } else {
      return v;
    }
  }

  /**
   * Returns the contained value if Some, otherwise throws an error.
   * Use with caution - prefer unwrapOr() or pattern matching when possible.
   *
   * @returns The contained value
   * @throws Error if this Option is None
   */
  unwrap():T {
    if(this.is_some) {
      return this.value;
    } else {
      throw new Error("Option: unwrap() called on a None value.")
    }
  }

  /**
   * Executes a function with the contained value if Some, otherwise does nothing.
   * Used for side effects when you only care about present values.
   *
   * @param f - Function to call with the contained value
   */
  iter(f:(arg:T)=>void) {
    if(this.is_some) {
      f(this.value)
    }
  }
}
