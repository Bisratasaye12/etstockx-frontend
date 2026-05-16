import type { UserSearchItemDto } from "@/shared/api/dtos/user-search";
import type { BrokerDirectoryEntry } from "@/shared/api/types";

export function userSearchItemToBrokerDirectoryEntry(
  item: UserSearchItemDto,
): BrokerDirectoryEntry {
  return {
    userId: item.userId,
    fullName: item.fullName,
    institution: item.institution,
    bio: null,
    licenseDisplay: null,
    specializations: [],
    isAcceptingRequests: item.isActivated,
  };
}

export type UserSearchRecipient = {
  userId: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  isSelectable: boolean;
};

export function userSearchItemToRecipient(
  item: UserSearchItemDto,
  options: { brokerFallbackLabel: string },
): UserSearchRecipient {
  const fullName = item.fullName?.trim() ?? "";
  const institution = item.institution?.trim() ?? "";
  const isBroker = item.role === "Broker" || item.role === "Dealer";

  return {
    userId: item.userId,
    primaryLabel: isBroker
      ? institution || fullName || options.brokerFallbackLabel
      : fullName || institution || options.brokerFallbackLabel,
    secondaryLabel:
      isBroker && fullName && institution
        ? fullName
        : !isBroker && institution
          ? institution
          : null,
    isSelectable: item.isActivated,
  };
}
