declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * A console warning in development only. For data that renders but almost
 * certainly isn't what the caller meant — never for something that breaks.
 * Guarded on `typeof process` so it can't throw in a browser bundle that
 * leaves `process` undefined.
 */
export function warnInDevelopment(message: string): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return;
  console.warn(`@pitchkit/react: ${message}`);
}
