import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/shared/api/types";
import {
  getErrorCodeFromHttpStatus,
  type ErrorCode,
} from "@/features/errors/lib/error-codes";

export function getApiErrorMessage(error: unknown): string {
  const ax = error as AxiosError<ApiErrorBody>;
  const msg = ax.response?.data?.error ?? ax.message;
  return typeof msg === "string" && msg.length > 0 ? msg : "Request failed";
}

export function getApiErrorStatus(error: unknown): number | undefined {
  const ax = error as AxiosError<ApiErrorBody>;
  return ax.response?.status;
}

export function getApiErrorCode(error: unknown): ErrorCode {
  const status = getApiErrorStatus(error);
  if (status == null) return "generic";
  return getErrorCodeFromHttpStatus(status);
}
