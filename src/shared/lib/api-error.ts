import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/shared/api/types";

export function getApiErrorMessage(error: unknown): string {
  const ax = error as AxiosError<ApiErrorBody>;
  const msg = ax.response?.data?.error ?? ax.message;
  return typeof msg === "string" && msg.length > 0 ? msg : "Request failed";
}
