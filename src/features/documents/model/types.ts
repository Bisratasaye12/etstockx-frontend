export type TradeAgreementStatus =
  | "AwaitingClientSignature"
  | "AwaitingBrokerSignature"
  | "FullySigned"
  | "Cancelled";

export interface TradeAgreementSignatureDto {
  id: string;
  signerUserId: string;
  signerRole: "Client" | "Broker";
  typedFullName: string;
  signedAt: string;
  signatureToken: string;
}

export interface TradeAgreementDto {
  id: string;
  documentNumber: string;
  requestId: string;
  requestType: "BuyRequest" | "SellRequest";
  clientId: string;
  brokerId: string;
  listingId: string | null;
  clientFullName: string;
  brokerFullName: string;
  brokerInstitution: string | null;
  instrumentName: string;
  ticker: string | null;
  quantity: number;
  unitPrice: number;
  currency: string;
  subtotal: number;
  feePercent: number;
  feeAmount: number;
  totalAmount: number;
  agreedAt: string;
  status: TradeAgreementStatus;
  documentHash: string | null;
  verificationUrl: string | null;
  cancellationReason: string | null;
  cancelledByUserId: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  signatures: TradeAgreementSignatureDto[];
}

export interface TradeAgreementVerificationDto {
  documentNumber: string;
  verified: boolean;
  status: string;
  storedHash: string | null;
  finalizedAt: string | null;
  signatures: TradeAgreementSignatureDto[];
}
