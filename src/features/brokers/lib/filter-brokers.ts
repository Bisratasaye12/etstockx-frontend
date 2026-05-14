import type { BrokerDirectoryEntry } from "@/shared/api/types";

export type SectorFilter = "Banking" | "Telecom" | "Agriculture";

export function brokerMatchesSector(
  broker: BrokerDirectoryEntry,
  sector: SectorFilter | null,
): boolean {
  if (!sector) return true;
  const tags = (broker.specializations ?? []).map((s) => s.toLowerCase());
  const needle = sector.toLowerCase();
  return tags.some((t) => t.includes(needle) || needle.includes(t));
}

export function personInitials(name: string | null | undefined): string {
  const s = name?.trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function brokerMatchesSearch(
  broker: BrokerDirectoryEntry,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    broker.fullName,
    broker.institution,
    broker.bio,
    broker.licenseDisplay,
    ...(broker.specializations ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function filterBrokers(
  brokers: BrokerDirectoryEntry[],
  options: {
    search: string;
    sector: SectorFilter | null;
    acceptingOnly: boolean;
  },
): BrokerDirectoryEntry[] {
  return brokers.filter((b) => {
    if (options.acceptingOnly && !b.isAcceptingRequests) return false;
    if (!brokerMatchesSector(b, options.sector)) return false;
    if (!brokerMatchesSearch(b, options.search)) return false;
    return true;
  });
}

export function institutionInitials(
  institution: string | null | undefined,
): string {
  const s = institution?.trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
