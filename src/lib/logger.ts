import { redactSecrets } from '@/lib/redact';

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
  if (typeof error === 'object' && error !== null) {
    try {
      return { error: JSON.stringify(error) };
    } catch {
      return { error: String(error) };
    }
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

  // Central safety net: no log line may contain a configured secret.
  const line = redactSecrets(JSON.stringify(entry));
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
