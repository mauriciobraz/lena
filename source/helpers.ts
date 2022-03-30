/**
 * Checks if the given matcher returns true, if so, returns the given value.
 * @throws {Error} If the matcher returns false.
 */
export function validateOrThrow<T>(
  value: T | undefined,
  matcher: (value: T) => boolean
): T {
  if (value === undefined) {
    throw new Error(
      'Expected a value but received undefined. Please check your code for errors.'
    );
  }

  if (!matcher(value)) {
    throw new Error(
      `Expected a value that matches the matcher but received ${value}. Please check your code for errors.`
    );
  }

  return value;
}

export function isSnowflake(value: string): boolean {
  return /^[0-9]{18}$/.test(value);
}
