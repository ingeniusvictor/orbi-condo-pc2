/**
 * ORBI Finance canonical ledger model.
 * All financial values are integer CLP. Signed credits must be preserved.
 * This is a schema and review policy only: no live accounting integration.
 */
export type FinancialSource = {
  sourceId: string;
  originalFilename: string;
  sourceSystem: "comunidad-feliz" | "other";
  period: string; // YYYY-MM, as printed on source
  importedAt: string; // ISO datetime
  documentHash?: string; // hash when ingestion backend exists
  pageCount?: number;
  reviewStatus: "pending" | "reviewed" | "rejected";
};
export type LedgerCategory =
  | "staff" | "administration" | "utilities" | "maintenance"
  | "repairs" | "supplies" | "projects" | "legal" | "other";
export type LedgerEntry = {
  entryId: string;
  sourceId: string;
  sourcePage: number;
  period: string; // accounting period, YYYY-MM
  paymentDate: string | null; // YYYY-MM-DD; may differ from period
  supplierDisplayName: string;
  description: string;
  documentNumber: string | null;
  category: LedgerCategory;
  amountClp: number; // negative for refunds, positive for expenses
  assetId?: string; // only when independently verified
  tower?: "A" | "B" | "C" | "D";
  installment?: {number: number; total: number};
  isPersonalData: boolean;
  reviewStatus: "pending" | "reviewed" | "rejected";
};
export type FinanceRole = "administrator" | "committee" | "resident";
export const mayViewEntry = (role: FinanceRole, entry: LedgerEntry) =>
  !entry.isPersonalData || role === "administrator";
export const publicAggregate = (entries: readonly LedgerEntry[]) =>
  entries.reduce((total, entry) => total + entry.amountClp, 0);
/** A reconciled import must match the source report, not an inferred bank balance. */
export const reconcileExpenseReport = (entries: readonly LedgerEntry[], statedTotalClp: number) => ({
  computedTotalClp: publicAggregate(entries),
  statedTotalClp,
  differenceClp: publicAggregate(entries) - statedTotalClp,
  balanced: publicAggregate(entries) === statedTotalClp
});
