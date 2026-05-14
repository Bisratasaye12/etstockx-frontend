import type { BrokerDirectoryEntry } from "@/shared/api/types";
import {
  institutionInitials,
  personInitials,
} from "@/features/brokers/lib/filter-brokers";

export function investorBrokerTitle(
  broker: BrokerDirectoryEntry | undefined,
  unknownLabel: string,
): string {
  if (!broker) return unknownLabel;
  return broker.institution?.trim() || broker.fullName?.trim() || unknownLabel;
}

export function investorBrokerAvatarLabel(
  broker: BrokerDirectoryEntry | undefined,
  fallbackTitle: string,
): string {
  if (!broker) return personInitials(fallbackTitle);
  if (broker.institution?.trim())
    return institutionInitials(broker.institution);
  return personInitials(broker.fullName ?? "");
}
