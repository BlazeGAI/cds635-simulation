function validate(schema, data, path = '') {
  const errors = [];

  const addError = (message) => {
    errors.push({ instancePath: path || '/', message });
  };

  if (schema.oneOf) {
    const passing = schema.oneOf.filter((candidate) => validate(candidate, data, path).length === 0);
    if (passing.length !== 1) {
      addError('must match exactly one schema in oneOf');
    }
    return errors;
  }

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = Array.isArray(data)
      ? 'array'
      : data === null
        ? 'null'
        : typeof data;

    if (!allowedTypes.includes(actualType)) {
      addError(`must be ${allowedTypes.join(' or ')}`);
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(data)) {
    addError(`must be one of: ${schema.enum.join(', ')}`);
  }

  if (typeof data === 'string' && typeof schema.minLength === 'number' && data.length < schema.minLength) {
    addError(`must NOT have fewer than ${schema.minLength} characters`);
  }

  if (Array.isArray(data)) {
    if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
      addError(`must NOT have fewer than ${schema.minItems} items`);
    }
    if (schema.items) {
      data.forEach((item, index) => {
        errors.push(...validate(schema.items, item, `${path}/${index}`));
      });
    }
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in data)) {
          errors.push({ instancePath: path || '/', message: `must have required property '${key}'` });
        }
      }
    }

    if (schema.additionalProperties === false && schema.properties) {
      const allowedKeys = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(data)) {
        if (!allowedKeys.has(key)) {
          errors.push({ instancePath: path || '/', message: `must NOT have additional property '${key}'` });
        }
      }
    }

    if (schema.properties) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        if (key in data) {
          errors.push(...validate(propertySchema, data[key], `${path}/${key}`));
        }
      }
    }
  }

  return errors;
}

module.exports = { validate };
