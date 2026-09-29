type LogLevel = 'info' | 'warn' | 'error';

export type LogFields = Record<string, string | number | boolean | null | undefined>;

function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      error: error.message,
      stack: error.stack,
      ...(error.cause instanceof Error ? { cause: error.cause.message } : {}),
    };
  }
  return { error: String(error) };
}

function write(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(message: string, fields?: LogFields) {
    write('info', message, fields);
  },
  warn(message: string, fields?: LogFields) {
    write('warn', message, fields);
  },
  error(message: string, error?: unknown, fields?: LogFields) {
    write('error', message, { ...fields, ...(error !== undefined ? serializeError(error) : {}) });
  },
};
