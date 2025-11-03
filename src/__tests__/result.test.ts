import { vi } from 'vitest';
import { Result } from '../result';

describe('Result', () => {
  describe('Ok', () => {
    it('should create a success Result with a value', () => {
      const result = Result.Ok<number, string>(42);
      expect(result.is_ok).toBe(true);
      expect(result.value).toBe(42);
      expect(result.err).toBeUndefined();
    });

    it('should create a Result with string value', () => {
      const result = Result.Ok<string, Error>('hello');
      expect(result.is_ok).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should create a Result with object value', () => {
      const obj = { foo: 'bar' };
      const result = Result.Ok<typeof obj, string>(obj);
      expect(result.is_ok).toBe(true);
      expect(result.value).toBe(obj);
    });
  });

  describe('Err', () => {
    it('should create an error Result', () => {
      const result = Result.Err<number, string>('error message');
      expect(result.is_ok).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.err).toBe('error message');
    });

    it('should create a Result with Error object', () => {
      const error = new Error('something went wrong');
      const result = Result.Err<number, Error>(error);
      expect(result.is_ok).toBe(false);
      expect(result.err).toBe(error);
    });

    it('should work with different error types', () => {
      const result1 = Result.Err<number, string>('error');
      const result2 = Result.Err<string, number>(404);
      const result3 = Result.Err<boolean, { code: number }>({ code: 500 });

      expect(result1.is_ok).toBe(false);
      expect(result2.is_ok).toBe(false);
      expect(result3.is_ok).toBe(false);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = Result.Ok<number, string>(5);
      const mapped = result.map(x => x * 2);
      expect(mapped.is_ok).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('should chain multiple map operations', () => {
      const result = Result.Ok<number, string>(5);
      const mapped = result
        .map(x => x * 2)
        .map(x => x + 3)
        .map(x => x.toString());
      expect(mapped.is_ok).toBe(true);
      expect(mapped.value).toBe('13');
    });

    it('should not call function on Err', () => {
      const mockFn = vi.fn(x => x * 2);
      const result = Result.Err<number, string>('error');
      const mapped = result.map(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(mapped.is_ok).toBe(false);
      expect(mapped.err).toBe('error');
    });

    it('should propagate error through map chain', () => {
      const result = Result.Err<number, string>('original error');
      const mapped = result
        .map(x => x * 2)
        .map(x => x.toString());

      expect(mapped.is_ok).toBe(false);
      expect(mapped.err).toBe('original error');
    });

    it('should transform to different type', () => {
      const result = Result.Ok<number, string>(42);
      const mapped = result.map(x => ({ value: x }));
      expect(mapped.is_ok).toBe(true);
      expect(mapped.value).toEqual({ value: 42 });
    });
  });

  describe('andThen', () => {
    it('should chain Ok with function returning Ok', () => {
      const result = Result.Ok<number, string>(5);
      const chained = result.andThen(x => Result.Ok(x * 2));
      expect(chained.is_ok).toBe(true);
      expect(chained.value).toBe(10);
    });

    it('should chain Ok with function returning Err', () => {
      const result = Result.Ok<number, string>(5);
      const chained = result.andThen(_x => Result.Err('operation failed'));
      expect(chained.is_ok).toBe(false);
      expect(chained.err).toBe('operation failed');
    });

    it('should not call function on Err', () => {
      const mockFn = vi.fn((x: number) => Result.Ok<number, string>(x * 2));
      const result = Result.Err<number, string>('error');
      const chained = result.andThen(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(chained.is_ok).toBe(false);
      expect(chained.err).toBe('error');
    });

    it('should chain multiple andThen operations', () => {
      const result = Result.Ok<number, string>(10);
      const chained = result
        .andThen((x: number) => x > 5 ? Result.Ok<number, string>(x) : Result.Err<number, string>('too small'))
        .andThen((x: number) => Result.Ok<number, string>(x * 2))
        .andThen((x: number) => Result.Ok<string, string>(x.toString()));

      expect(chained.is_ok).toBe(true);
      expect(chained.value).toBe('20');
    });

    it('should short-circuit on Err in chain', () => {
      const mockFn = vi.fn((x: number) => Result.Ok<number, string>(x * 2));
      const result = Result.Ok<number, string>(3);
      const chained = result
        .andThen((x: number) => x > 5 ? Result.Ok<number, string>(x) : Result.Err<number, string>('too small'))
        .andThen(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(chained.is_ok).toBe(false);
      expect(chained.err).toBe('too small');
    });

    it('should transform to different type', () => {
      const result = Result.Ok<number, string>(42);
      const chained = result.andThen(x => Result.Ok({ value: x }));
      expect(chained.is_ok).toBe(true);
      expect(chained.value).toEqual({ value: 42 });
    });
  });

  describe('orElse', () => {
    it('should return Ok unchanged', () => {
      const result = Result.Ok<number, string>(42);
      const fallback = result.orElse(() => Result.Ok(0));
      expect(fallback.is_ok).toBe(true);
      expect(fallback.value).toBe(42);
    });

    it('should not call function on Ok', () => {
      const mockFn = vi.fn(() => Result.Ok<number, string>(0));
      const result = Result.Ok<number, string>(42);
      result.orElse(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should call function on Err', () => {
      const result = Result.Err<number, string>('error');
      const fallback = result.orElse(() => Result.Ok(0));
      expect(fallback.is_ok).toBe(true);
      expect(fallback.value).toBe(0);
    });

    it('should allow error recovery', () => {
      const result = Result.Err<number, string>('network error');
      const recovered = result.orElse(() => Result.Ok(42));
      expect(recovered.is_ok).toBe(true);
      expect(recovered.value).toBe(42);
    });

    it('should allow chaining different error handlers', () => {
      const result = Result.Err<number, string>('error');
      const recovered = result
        .orElse(() => Result.Err<number, string>('still failing'))
        .orElse(() => Result.Ok(0));

      expect(recovered.is_ok).toBe(true);
      expect(recovered.value).toBe(0);
    });

    it('should preserve Err if fallback also fails', () => {
      const result = Result.Err<number, string>('first error');
      const fallback = result.orElse(() => Result.Err('second error'));
      expect(fallback.is_ok).toBe(false);
      expect(fallback.err).toBe('second error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value from Ok', () => {
      const result = Result.Ok<number, string>(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it('should return default from Err', () => {
      const result = Result.Err<number, string>('error');
      expect(result.unwrapOr(0)).toBe(0);
    });

    it('should work with string values', () => {
      const ok = Result.Ok<string, Error>('hello');
      const err = Result.Err<string, Error>(new Error('failed'));

      expect(ok.unwrapOr('default')).toBe('hello');
      expect(err.unwrapOr('default')).toBe('default');
    });

    it('should work with object values', () => {
      const defaultObj = { x: 0 };
      const valueObj = { x: 42 };

      const ok = Result.Ok<typeof valueObj, string>(valueObj);
      const err = Result.Err<typeof defaultObj, string>('error');

      expect(ok.unwrapOr(defaultObj)).toBe(valueObj);
      expect(err.unwrapOr(defaultObj)).toBe(defaultObj);
    });
  });

  describe('unwrap', () => {
    it('should return value from Ok', () => {
      const result = Result.Ok<number, string>(42);
      expect(result.unwrap()).toBe(42);
    });

    it('should throw error on Err', () => {
      const result = Result.Err<number, string>('error');
      expect(() => result.unwrap()).toThrow('Option: unwrap() called on a Err value.');
    });

    it('should work with different value types', () => {
      expect(Result.Ok<string, Error>('hello').unwrap()).toBe('hello');
      expect(Result.Ok<boolean, string>(true).unwrap()).toBe(true);
      expect(Result.Ok<{ x: number }, string>({ x: 1 }).unwrap()).toEqual({ x: 1 });
    });
  });

  describe('iter', () => {
    it('should call function with Ok value', () => {
      const mockFn = vi.fn();
      const result = Result.Ok<number, string>(42);
      result.iter(mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(42);
    });

    it('should not call function on Err', () => {
      const mockFn = vi.fn();
      const result = Result.Err<number, string>('error');
      result.iter(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should allow side effects', () => {
      let sideEffect = 0;
      const result = Result.Ok<number, string>(10);
      result.iter(x => { sideEffect = x * 2; });

      expect(sideEffect).toBe(20);
    });

    it('should not return anything', () => {
      const result = Result.Ok<number, string>(42);
      const returnValue = result.iter(x => x * 2);

      expect(returnValue).toBeUndefined();
    });
  });

  describe('composition and real-world scenarios', () => {
    it('should handle division with error checking', () => {
      function safeDivide(a: number, b: number): Result<number, string> {
        return b === 0
          ? Result.Err('Division by zero')
          : Result.Ok(a / b);
      }

      const success = safeDivide(10, 2)
        .map(x => x * 3)
        .map(x => Math.round(x));

      const failure = safeDivide(10, 0)
        .map(x => x * 3);

      expect(success.unwrapOr(0)).toBe(15);
      expect(failure.unwrapOr(0)).toBe(0);
      expect(failure.err).toBe('Division by zero');
    });

    it('should handle file parsing scenario', () => {
      interface FileData {
        content: string;
        size: number;
      }

      function readFile(path: string): Result<string, string> {
        return path.endsWith('.txt')
          ? Result.Ok('file contents')
          : Result.Err('Invalid file extension');
      }

      function parseFile(content: string): Result<FileData, string> {
        return content.length > 0
          ? Result.Ok({ content, size: content.length })
          : Result.Err('Empty file');
      }

      const success = readFile('data.txt').andThen(parseFile);
      const invalidExt = readFile('data.pdf').andThen(parseFile);

      expect(success.is_ok).toBe(true);
      expect(success.value?.content).toBe('file contents');
      expect(invalidExt.is_ok).toBe(false);
      expect(invalidExt.err).toBe('Invalid file extension');
    });

    it('should handle validation chains', () => {
      interface User {
        name: string;
        age: number;
      }

      function validateName(name: string): Result<string, string> {
        return name.length >= 3
          ? Result.Ok(name)
          : Result.Err('Name too short');
      }

      function validateAge(age: number): Result<number, string> {
        return age >= 18
          ? Result.Ok(age)
          : Result.Err('Must be 18 or older');
      }

      function createUser(name: string, age: number): Result<User, string> {
        return validateName(name).andThen(validName =>
          validateAge(age).map(validAge => ({
            name: validName,
            age: validAge
          }))
        );
      }

      const valid = createUser('Alice', 25);
      const invalidName = createUser('Al', 25);
      const invalidAge = createUser('Alice', 16);

      expect(valid.is_ok).toBe(true);
      expect(valid.value).toEqual({ name: 'Alice', age: 25 });
      expect(invalidName.err).toBe('Name too short');
      expect(invalidAge.err).toBe('Must be 18 or older');
    });

    it('should handle error recovery with orElse', () => {
      function fetchFromPrimary(): Result<string, string> {
        return Result.Err('Primary server down');
      }

      function fetchFromBackup(): Result<string, string> {
        return Result.Ok('Data from backup');
      }

      function fetchFromCache(): Result<string, string> {
        return Result.Ok('Cached data');
      }

      const data = fetchFromPrimary()
        .orElse(() => fetchFromBackup())
        .orElse(() => fetchFromCache());

      expect(data.is_ok).toBe(true);
      expect(data.value).toBe('Data from backup');
    });

    it('should combine multiple fallible operations', () => {
      function parseJSON(str: string): Result<any, string> {
        try {
          return Result.Ok(JSON.parse(str));
        } catch (e) {
          return Result.Err('Invalid JSON');
        }
      }

      function extractField(obj: any, field: string): Result<any, string> {
        return obj[field] !== undefined
          ? Result.Ok(obj[field])
          : Result.Err(`Field '${field}' not found`);
      }

      const validJSON = '{"name": "Alice", "age": 30}';
      const invalidJSON = '{invalid}';

      const success = parseJSON(validJSON)
        .andThen(obj => extractField(obj, 'name'));

      const parseError = parseJSON(invalidJSON)
        .andThen(obj => extractField(obj, 'name'));

      const missingField = parseJSON(validJSON)
        .andThen(obj => extractField(obj, 'email'));

      expect(success.unwrapOr('Unknown')).toBe('Alice');
      expect(parseError.err).toBe('Invalid JSON');
      expect(missingField.err).toBe("Field 'email' not found");
    });
  });
});
