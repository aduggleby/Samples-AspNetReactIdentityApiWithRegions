interface RetryOptions {
  retries: number;
  delay?: number;
  onRetry?: (error: any, attempt: number) => Promise<void> | void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay = 1000, onRetry } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }

      if (onRetry) {
        await onRetry(error, attempt);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Maximum retry attempts exceeded");
}
