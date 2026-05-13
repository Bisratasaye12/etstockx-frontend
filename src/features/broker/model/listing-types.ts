import type { Listing } from "@/entities/listing/model/types";

export type ListingSummaryDto = Listing;

export interface ListingSummaryDtoPagedResult {
  items: ListingSummaryDto[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
