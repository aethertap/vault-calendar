export class Result<T,E> {
  is_ok: boolean
  value:T|undefined
  err:E|undefined
  constructor(arg:T|undefined,is_ok:boolean) {
    this.is_ok = is_ok;
    this.value = arg;
  }
  static Ok<T,E>(arg:T):Result<T,E> {
    return new Result(arg,true)
  }
  static Err<T,E>(err:E):Result<T,E> {
    let r = new Result(undefined,false);
    r.err=err;
    return r as Result<T,E>;
  }
  andThen<U>(f:(arg:T)=>Result<U,E>):Result<U,E> {
    if(this.is_ok) {
      return f(this.value);
    } else {
      return Result.Err(this.err);
    }
  }
  orElse(f:()=>Result<T,E>):Result<T,E> {
    if(this.is_ok) {
      return this;
    } else {
      return f()
    }
  }
  map<U>(f:(arg:T)=>U):Result<U,E> {
    return this.andThen((a)=>Result.Ok(f(a)))
  }
  unwrapOr(v:T):T {
    if(this.is_ok) {
      return this.value;
    } else {
      return v;
    }
  }
  unwrap():T {
    if(this.is_ok) {
      return this.value;
    } else {
      throw new Error("Option: unwrap() called on a Err value.")
    }
  }
  iter(f:(arg:T)=>void) {
    if(this.is_ok) {
      f(this.value)
    }
  }
}
