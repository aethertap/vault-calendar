

export class Option<T> {
  is_some: boolean
  value:T|undefined
  constructor(arg:T|undefined,is_some:boolean) {
    this.is_some = is_some;
    this.value = arg;
  }
  static Some<T>(arg:T):Option<T> {
    return new Option(arg,true)
  }
  static None<T>():Option<T> {
    return new Option(undefined,false);
  }
  andThen<U>(f:(arg:T)=>Option<U>):Option<U> {
    if(this.is_some) {
      return f(this.value);
    } else {
      return Option.None();
    }
  }
  map<U>(f:(arg:T)=>U):Option<U> {
    return this.andThen((a)=>Option.Some(f(a)))
  }
  unwrapOr(v:T):T {
    if(this.is_some) {
      return this.value;
    } else {
      return v;
    }
  }
  unwrap():T {
    if(this.is_some) {
      return this.value;
    } else {
      throw new Error("Option: unwrap() called on a None value.")
    }
  }
  iter(f:(arg:T)=>void) {
    if(this.is_some) {
      f(this.value)
    }
  }
}
