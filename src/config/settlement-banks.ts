import settlementBanksJson from "@/config/settlement-banks.json";

type SettlementBanksConfig = {
  banks: string[];
};

function loadSettlementBankOptions(): readonly string[] {
  const raw = settlementBanksJson as SettlementBanksConfig;
  const banks = (raw.banks ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  return Object.freeze(banks);
}

/** Settlement banks for client profile — edit `src/config/settlement-banks.json`. */
export const SETTLEMENT_BANK_OPTIONS = loadSettlementBankOptions();

/** @deprecated Use `SETTLEMENT_BANK_OPTIONS` from `@/config/settlement-banks`. */
export const ETHIOPIAN_BANK_OPTIONS = SETTLEMENT_BANK_OPTIONS;

export function settlementBankOptionsForValue(
  currentValue: string,
): readonly string[] {
  const trimmed = currentValue.trim();
  if (!trimmed || SETTLEMENT_BANK_OPTIONS.includes(trimmed)) {
    return SETTLEMENT_BANK_OPTIONS;
  }
  return [trimmed, ...SETTLEMENT_BANK_OPTIONS];
}
