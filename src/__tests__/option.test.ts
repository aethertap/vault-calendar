import { vi } from 'vitest';
import { Option } from '../option';

describe('Option', () => {
  describe('Some', () => {
    it('should create an Option with a value', () => {
      const opt = Option.Some(42);
      expect(opt.is_some).toBe(true);
      expect(opt.value).toBe(42);
    });

    it('should create an Option with string value', () => {
      const opt = Option.Some('hello');
      expect(opt.is_some).toBe(true);
      expect(opt.value).toBe('hello');
    });

    it('should create an Option with object value', () => {
      const obj = { foo: 'bar' };
      const opt = Option.Some(obj);
      expect(opt.is_some).toBe(true);
      expect(opt.value).toBe(obj);
    });

    it('should create an Option with null value', () => {
      const opt = Option.Some(null);
      expect(opt.is_some).toBe(true);
      expect(opt.value).toBe(null);
    });
  });

  describe('None', () => {
    it('should create an Option without a value', () => {
      const opt = Option.None<number>();
      expect(opt.is_some).toBe(false);
      expect(opt.value).toBeUndefined();
    });

    it('should work with different type parameters', () => {
      const opt1 = Option.None<string>();
      const opt2 = Option.None<{ x: number }>();
      expect(opt1.is_some).toBe(false);
      expect(opt2.is_some).toBe(false);
    });
  });

  describe('map', () => {
    it('should transform Some value', () => {
      const opt = Option.Some(5);
      const result = opt.map(x => x * 2);
      expect(result.is_some).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should chain multiple map operations', () => {
      const opt = Option.Some(5);
      const result = opt
        .map(x => x * 2)
        .map(x => x + 3)
        .map(x => x.toString());
      expect(result.is_some).toBe(true);
      expect(result.value).toBe('13');
    });

    it('should not call function on None', () => {
      const mockFn = vi.fn(x => x * 2);
      const opt = Option.None<number>();
      const result = opt.map(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(result.is_some).toBe(false);
    });

    it('should transform to different type', () => {
      const opt = Option.Some(42);
      const result = opt.map(x => `number: ${x}`);
      expect(result.is_some).toBe(true);
      expect(result.value).toBe('number: 42');
    });
  });

  describe('andThen', () => {
    it('should chain Some with function returning Some', () => {
      const opt = Option.Some(5);
      const result = opt.andThen(x => Option.Some(x * 2));
      expect(result.is_some).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should chain Some with function returning None', () => {
      const opt = Option.Some(5);
      const result = opt.andThen(_x => Option.None<number>());
      expect(result.is_some).toBe(false);
    });

    it('should not call function on None', () => {
      const mockFn = vi.fn(x => Option.Some(x * 2));
      const opt = Option.None<number>();
      const result = opt.andThen(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(result.is_some).toBe(false);
    });

    it('should chain multiple andThen operations', () => {
      const opt = Option.Some(10);
      const result = opt
        .andThen((x: number) => x > 5 ? Option.Some(x) : Option.None<number>())
        .andThen((x: number) => Option.Some(x * 2))
        .andThen((x: number) => Option.Some(x.toString()));

      expect(result.is_some).toBe(true);
      expect(result.value).toBe('20');
    });

    it('should short-circuit on None in chain', () => {
      const mockFn = vi.fn((x: number) => Option.Some(x * 2));
      const opt = Option.Some(3);
      const result = opt
        .andThen((x: number) => x > 5 ? Option.Some(x) : Option.None<number>())
        .andThen(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(result.is_some).toBe(false);
    });

    it('should transform to different type', () => {
      const opt = Option.Some(42);
      const result = opt.andThen(x => Option.Some({ value: x }));
      expect(result.is_some).toBe(true);
      expect(result.value).toEqual({ value: 42 });
    });
  });

  describe('unwrapOr', () => {
    it('should return value from Some', () => {
      const opt = Option.Some(42);
      expect(opt.unwrapOr(0)).toBe(42);
    });

    it('should return default from None', () => {
      const opt = Option.None<number>();
      expect(opt.unwrapOr(0)).toBe(0);
    });

    it('should work with string values', () => {
      const some = Option.Some('hello');
      const none = Option.None<string>();

      expect(some.unwrapOr('default')).toBe('hello');
      expect(none.unwrapOr('default')).toBe('default');
    });

    it('should work with object values', () => {
      const defaultObj = { x: 0 };
      const valueObj = { x: 42 };

      const some = Option.Some(valueObj);
      const none = Option.None<{ x: number }>();

      expect(some.unwrapOr(defaultObj)).toBe(valueObj);
      expect(none.unwrapOr(defaultObj)).toBe(defaultObj);
    });
  });

  describe('unwrap', () => {
    it('should return value from Some', () => {
      const opt = Option.Some(42);
      expect(opt.unwrap()).toBe(42);
    });

    it('should throw error on None', () => {
      const opt = Option.None<number>();
      expect(() => opt.unwrap()).toThrow('Option: unwrap() called on a None value.');
    });

    it('should work with different value types', () => {
      expect(Option.Some('hello').unwrap()).toBe('hello');
      expect(Option.Some(true).unwrap()).toBe(true);
      expect(Option.Some({ x: 1 }).unwrap()).toEqual({ x: 1 });
    });
  });

  describe('iter', () => {
    it('should call function with Some value', () => {
      const mockFn = vi.fn();
      const opt = Option.Some(42);
      opt.iter(mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(42);
    });

    it('should not call function on None', () => {
      const mockFn = vi.fn();
      const opt = Option.None<number>();
      opt.iter(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should allow side effects', () => {
      let sideEffect = 0;
      const opt = Option.Some(10);
      opt.iter(x => { sideEffect = x * 2; });

      expect(sideEffect).toBe(20);
    });

    it('should not return anything', () => {
      const opt = Option.Some(42);
      const result = opt.iter(x => x * 2);

      expect(result).toBeUndefined();
    });
  });

  describe('composition and real-world scenarios', () => {
    it('should safely parse and transform user input', () => {
      function parseNumber(str: string): Option<number> {
        const num = parseInt(str);
        return isNaN(num) ? Option.None<number>() : Option.Some(num);
      }

      const valid = parseNumber('42')
        .map((x: number) => x * 2)
        .map((x: number) => `Result: ${x}`);

      const invalid = parseNumber('not a number')
        .map((x: number) => x * 2)
        .map((x: number) => `Result: ${x}`);

      expect(valid.unwrapOr('Invalid')).toBe('Result: 84');
      expect(invalid.unwrapOr('Invalid')).toBe('Invalid');
    });

    it('should handle optional configuration values', () => {
      interface Config {
        timeout?: number;
        retries?: number;
      }

      function getTimeout(config: Config): Option<number> {
        return config.timeout !== undefined
          ? Option.Some(config.timeout)
          : Option.None();
      }

      const withTimeout = getTimeout({ timeout: 5000 });
      const withoutTimeout = getTimeout({});

      expect(withTimeout.unwrapOr(3000)).toBe(5000);
      expect(withoutTimeout.unwrapOr(3000)).toBe(3000);
    });

    it('should chain optional lookups', () => {
      interface User {
        name: string;
        email?: string;
      }

      function getUser(id: number): Option<User> {
        return id === 1
          ? Option.Some({ name: 'Alice', email: 'alice@example.com' })
          : Option.None();
      }

      function getEmail(user: User): Option<string> {
        return user.email ? Option.Some(user.email) : Option.None();
      }

      const email = getUser(1).andThen(getEmail);
      const noEmail = getUser(999).andThen(getEmail);

      expect(email.unwrapOr('no-email@example.com')).toBe('alice@example.com');
      expect(noEmail.unwrapOr('no-email@example.com')).toBe('no-email@example.com');
    });
  });
});
