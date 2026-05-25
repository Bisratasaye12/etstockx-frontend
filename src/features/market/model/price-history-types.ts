export interface SecurityPriceSnapshotDto {
  id: string;
  securityId: string;
  price: number;
  volume: number;
  source: string;
  recordedAt: string;
}
