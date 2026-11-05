import {EegMember} from "./eeg.model";

type SettlementInterval = EegMember["settlementInterval"]

// Shown in the EEG details. The interval is changed only in eegfaktura-web (platform#230).
const SETTLEMENT_LABELS: Record<SettlementInterval, string> = {
  MONTHLY: "Monatlich",
  QUARTER: "Vierteljährlich",
  BIANNUAL: "Halbjährlich",
  ANNUAL: "Jährlich",
}

// Unknown or missing values are shown as they are.
export const settlementLabel = (interval?: string) =>
  interval && Object.prototype.hasOwnProperty.call(SETTLEMENT_LABELS, interval)
    ? SETTLEMENT_LABELS[interval as SettlementInterval]
    : interval
