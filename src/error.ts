export class KnownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnownError";
  }
}

export const isKnownError = (error: unknown): error is KnownError => {
  return error instanceof KnownError;
};

export const handleCliError = (error: unknown): void => {
  if (isKnownError(error)) {
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error("\nUnexpected error", error.stack);
  }
  process.exit(1);
};
