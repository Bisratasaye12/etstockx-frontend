export const ERROR_CODES = ["404", "401", "403", "500", "generic"] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

export function getErrorCodeFromHttpStatus(status: number): ErrorCode {
  if (status === 401) return "401";
  if (status === 403) return "403";
  if (status === 404) return "404";
  if (status >= 500) return "500";
  return "generic";
}
