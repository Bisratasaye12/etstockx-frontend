export type { BrokerDirectoryEntry, BrokerProfile } from "@/shared/api/types";

/** Client row derived from broker trade queue (no dedicated list endpoint in API). */
export type BrokerClientListRow = {
  clientId: string;
  displayName: string;
  lastRequestAt: string;
};
