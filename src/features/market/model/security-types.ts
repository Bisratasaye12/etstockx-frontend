/** OpenAPI `SecurityDto`. */
export interface SecurityDto {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  isin: string | null;
  status: string;
  referencePrice: number | null;
  referenceCurrency: string;
  referencePriceUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedSecuritiesDto {
  items: SecurityDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
