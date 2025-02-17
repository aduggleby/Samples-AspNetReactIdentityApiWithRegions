const isDevelopment = process.env.NODE_ENV !== "production";

export const createLogger = (namespace: string) => {
  const formatMessage = (level: string, ...args: any[]) => [
    `[${namespace}:${level}]`,
    ...args,
  ];

  return {
    debug: (...args: any[]) => {
      if (isDevelopment) {
        console.debug(...formatMessage("debug", ...args));
      }
    },
    info: (...args: any[]) => {
      if (isDevelopment) {
        console.info(...formatMessage("info", ...args));
      }
    },
    warn: (...args: any[]) => {
      if (isDevelopment) {
        console.warn(...formatMessage("warn", ...args));
      }
    },
    error: (...args: any[]) => {
      if (isDevelopment) {
        console.error(...formatMessage("error", ...args));
      }
    },
  };
};

// Create a test log to verify it's working
const testLogger = createLogger("logger-init");
testLogger.info("Logger initialized");
