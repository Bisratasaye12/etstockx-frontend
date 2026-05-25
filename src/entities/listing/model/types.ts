export interface Listing {
  id: string;
  securityId: string;
  brokerId: string;
  instrumentName: string | null;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string | null;
  securityReferencePrice?: number | null;
  quantity: number;
  status: string | null;
  createdAt: string;
}
