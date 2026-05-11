export interface Listing {
  id: string;
  brokerId: string;
  instrumentName: string | null;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string | null;
  quantity: number;
  status: string | null;
  createdAt: string;
}
