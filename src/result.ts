/**
 * A Result type representing either a successful value (Ok) or an error (Err).
 * This is a Rust-inspired type for error handling without exceptions.
 * Used throughout the codebase for operations that may fail, such as parsing and validation.
 *
 * @template T - The type of the success value
 * @template E - The type of the error value
 */
export class Result<T,E> {
  /** Indicates whether this Result contains a success value */
  is_ok: boolean
  /** The success value, if is_ok is true */
  value:T|undefined
  /** The error value, if is_ok is false */
  err:E|undefined

  /**
   * Constructs a new Result. Use static methods Ok() and Err() instead of calling directly.
   *
   * @param arg - The value to store (for Ok results)
   * @param is_ok - Whether this is a success result
   */
  constructor(arg:T|undefined,is_ok:boolean) {
    this.is_ok = is_ok;
    this.value = arg;
  }

  /**
   * Creates a successful Result containing the given value.
   * Used throughout the codebase when operations succeed.
   *
   * @template T - The type of the success value
   * @template E - The type of potential errors
   * @param arg - The success value to wrap
   * @returns A Result representing success
   */
  static Ok<T,E>(arg:T):Result<T,E> {
    return new Result(arg,true)
  }

  /**
   * Creates an error Result containing the given error.
   * Used throughout the codebase when operations fail.
   *
   * @template T - The type of potential success values
   * @template E - The type of the error value
   * @param err - The error value to wrap
   * @returns A Result representing failure
   */
  static Err<T,E>(err:E):Result<T,E> {
    let r = new Result(undefined,false);
    r.err=err;
    return r as Result<T,E>;
  }

  /**
   * Chains operations that return Results. If this Result is Ok, applies the function.
   * If this Result is Err, propagates the error without calling the function.
   * Used for sequential operations that may fail.
   *
   * @template U - The type of the new success value
   * @param f - Function to apply to the success value
   * @returns A new Result from the function, or the propagated error
   */
  andThen<U>(f:(arg:T)=>Result<U,E>):Result<U,E> {
    if(this.is_ok) {
      return f(this.value);
    } else {
      return Result.Err(this.err);
    }
  }

  /**
   * Provides an alternative Result if this one is an error.
   * If this Result is Ok, returns it unchanged. Otherwise calls the function.
   * Used for fallback logic and error recovery.
   *
   * @param f - Function that provides an alternative Result
   * @returns This Result if Ok, otherwise the result of calling f
   */
  orElse(f:()=>Result<T,E>):Result<T,E> {
    if(this.is_ok) {
      return this;
    } else {
      return f()
    }
  }

  /**
   * Transforms the success value using the given function.
   * If this Result is Err, the error is propagated unchanged.
   * Used to transform successful values while preserving error handling.
   *
   * @template U - The type of the transformed value
   * @param f - Function to transform the success value
   * @returns A new Result with the transformed value or the original error
   */
  map<U>(f:(arg:T)=>U):Result<U,E> {
    return this.andThen((a)=>Result.Ok(f(a)))
  }

  /**
   * Returns the success value if Ok, otherwise returns the provided default.
   * Used to extract values with a fallback when errors don't need special handling.
   *
   * @param v - The default value to return if this Result is Err
   * @returns The success value or the default
   */
  unwrapOr(v:T):T {
    if(this.is_ok) {
      return this.value;
    } else {
      return v;
    }
  }

  /**
   * Returns the success value if Ok, otherwise throws an error.
   * Use with caution - prefer unwrapOr() or pattern matching when possible.
   *
   * @returns The success value
   * @throws Error if this Result is Err
   */
  unwrap():T {
    if(this.is_ok) {
      return this.value;
    } else {
      throw new Error("Option: unwrap() called on a Err value.")
    }
  }

  /**
   * Executes a function with the success value if Ok, otherwise does nothing.
   * Used for side effects when you only care about successful results.
   *
   * @param f - Function to call with the success value
   */
  iter(f:(arg:T)=>void) {
    if(this.is_ok) {
      f(this.value)
    }
  }
}
