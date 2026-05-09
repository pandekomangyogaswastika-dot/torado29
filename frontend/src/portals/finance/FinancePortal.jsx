/** Finance Portal shell — Navigation Restructuring: PortalSubNav removed, AppShell Sidebar+Subnav handles navigation. */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import FinanceHome from "./FinanceHome";
import ValidationQueue from "./ValidationQueue";
import JournalList from "./JournalList";
import JournalDetail from "./JournalDetail";
import ManualJournalForm from "./ManualJournalForm";
import TrialBalance from "./TrialBalance";
import ProfitLoss from "./ProfitLoss";
import BalanceSheet from "./BalanceSheet";
import CashflowReport from "./CashflowReport";
import APAging from "./APAging";
import COABrowser from "./COABrowser";
import PeriodList from "./PeriodList";
import PeriodClosingWizard from "./PeriodClosingWizard";
import ReportBuilder from "./ReportBuilder";
import PivotReport from "./PivotReport";
import Comparatives from "./Comparatives";
import VendorScorecard from "./VendorScorecard";
import Forecasting from "./Forecasting";
import AnomalyFeed from "./AnomalyFeed";
import PaymentList from "./PaymentList";
import PaymentForm from "./PaymentForm";
import PaymentDetail from "./PaymentDetail";
import PaymentRequestList from "./PaymentRequestList";
import PaymentRequestForm from "./PaymentRequestForm";
import PaymentRequestDetail from "./PaymentRequestDetail";
import BankRecon from "./BankRecon";
import CashPosition from "./CashPosition";
import TaxCenter from "./TaxCenter";
import EFakturExport from "./EFakturExport";
import EBupotExport from "./EBupotExport";
import FixedAssetList from "./FixedAssetList";
import FixedAssetDetail from "./FixedAssetDetail";
import BudgetVsActual from "./BudgetVsActual";
import BudgetManagement from "./BudgetManagement";
import ARInvoiceList from "./ARInvoiceList";
import ClosingWizard from "./ClosingWizard";

export default function FinancePortal() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Routes>
      <Route index element={<FinanceHome />} />
      <Route path="validation" element={<ValidationQueue />} />
      <Route path="payments" element={<PaymentList />} />
      <Route path="payments/new" element={<PaymentForm />} />
      <Route path="payments/:id" element={<PaymentDetail />} />
      <Route path="payment-requests" element={<PaymentRequestList />} />
      <Route path="payment-requests/new" element={<PaymentRequestForm />} />
      <Route path="payment-requests/:id" element={<PaymentRequestDetail />} />
      <Route path="journals" element={<JournalList />} />
      <Route path="journals/:id" element={<JournalDetail />} />
      <Route path="manual-journal" element={<ManualJournalForm />} />
      <Route path="trial-balance" element={<TrialBalance />} />
      <Route path="profit-loss" element={<ProfitLoss />} />
      <Route path="balance-sheet" element={<BalanceSheet />} />
      <Route path="cashflow" element={<CashflowReport />} />
      <Route path="ap-aging" element={<APAging />} />
      <Route path="tax" element={<TaxCenter />} />
      <Route path="efaktur" element={<EFakturExport />} />
      <Route path="ebupot" element={<EBupotExport />} />
      <Route path="assets" element={<FixedAssetList />} />
      <Route path="assets/:id" element={<FixedAssetDetail />} />
      <Route path="budget" element={<BudgetVsActual />} />
      <Route path="budget/manage" element={<BudgetManagement />} />
      <Route path="ar-invoices" element={<ARInvoiceList />} />
      <Route path="bank-recon" element={<BankRecon />} />
      <Route path="cash-position" element={<CashPosition />} />
      <Route path="report-builder" element={<ReportBuilder />} />
      <Route path="pivot" element={<PivotReport />} />
      <Route path="comparatives" element={<Comparatives />} />
      <Route path="forecasting" element={<Forecasting />} />
      <Route path="anomalies" element={<AnomalyFeed />} />
      <Route path="vendor-scorecard" element={<VendorScorecard />} />
      <Route path="periods" element={<PeriodList />} />
      <Route path="period-closing/:period" element={<PeriodClosingWizard />} />
      <Route path="closing-wizard" element={<ClosingWizard />} />
      <Route path="coa" element={<COABrowser />} />
    </Routes>
  );
}
