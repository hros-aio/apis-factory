export function isObject(item: any): boolean {
  return !!(item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Recursively deep merges source object into target object.
 * Returns a new object.
 */
export function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}

/**
 * Recursively scrubs sensitive keys from a configuration object for safe logging.
 */
export function maskSecrets(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => maskSecrets(item));
  }
  const result: any = {};
  const secretKeywords = ['password', 'secret', 'token', 'key'];
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSecret = secretKeywords.some(keyword => lowerKey.includes(keyword));
    if (isSecret && typeof value === 'string' && value.length > 0) {
      result[key] = '[MASKED]';
    } else if (typeof value === 'object') {
      result[key] = maskSecrets(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
