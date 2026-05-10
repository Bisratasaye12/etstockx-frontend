/** Subset of OpenAPI `BuyRequestDto` for investor dashboard lists. */
export interface BuyRequestDto {
  id: string;
  instrumentName: string | null;
  ticker: string | null;
  quantity: number;
  desiredPrice: number | null;
  currency: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}
