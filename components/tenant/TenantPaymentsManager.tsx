"use client";

import { useState } from "react";
import { formatPKR, formatBillingMonth } from "@/lib/utils/format";
import { PaymentTransaction } from "@/lib/payments/service";
import PaymentReceiptModal from "@/components/payments/PaymentReceiptModal";
import TenantNotifyPaymentModal from "./TenantNotifyPaymentModal";
import {
  Receipt,
  Printer,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Home,
  Wrench,
  Building2,
  Search,
  Filter,
  Bell,
} from "lucide-react";

interface TenantPaymentsManagerProps {
  payments: PaymentTransaction[];
  outstandingBalance: number;
  tenantName: string;
  shopName: string;
  referenceNumber?: string;
  monthlyRent?: number;
}

export default function TenantPaymentsManager({
  payments,
  outstandingBalance,
  tenantName,
  shopName,
  referenceNumber,
  monthlyRent = 0,
}: TenantPaymentsManagerProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchType = filterType === "ALL" || p.payment_type === filterType;
    const matchSearch =
      !searchQuery ||
      (p.receipt_number && p.receipt_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.payment_date && p.payment_date.includes(searchQuery)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  function handleOpenReceipt(payment: PaymentTransaction) {
    const billingMonth = formatBillingMonth(payment.payment_date.slice(0, 7) + "-01");
    setSelectedReceipt({
      receiptNumber: payment.receipt_number || `RCP-${payment.id}`,
      paymentDate: payment.payment_date,
      paymentAmount: Number(payment.amount),
      paymentType: payment.payment_type || "RENT",
      paymentMethod: payment.payment_method || "Cash",
      transactionReference: payment.transaction_reference,
      notes: payment.notes,
      tenantName: payment.tenant_name || tenantName,
      shopName: payment.shop_name || payment.unit_name || shopName,
      referenceNumber,
      billingMonth,
      rentAmount: monthlyRent,
      totalPayable: monthlyRent,
      totalPaid: payment.amount,
      remainingBalance: outstandingBalance,
    });
  }

  const categoryIcons: Record<string, any> = {
    RENT: Home,
    ELECTRICITY: Zap,
    SECURITY: ShieldCheck,
    MAINTENANCE: Wrench,
    OTHER: Building2,
  };

  const categories = ["ALL", "RENT", "SECURITY", "MAINTENANCE"];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#CBD4BC]/60">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2D5A43]">
            OFFICIAL TRANSACTIONS & RECEIPTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17211D] mt-1">
            Payment History & Receipts
          </h1>
          <p className="text-xs text-[#58655E]">
            Access, verify, download, and print official receipts for all settled rent and utility dues.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNotifyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#17211D] text-[#F4F7F2] text-xs font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Bell size={14} className="text-[#8FA66B]" />
          <span>Notify Admin of Payment</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase text-[#58655E]">
            TOTAL PAID TO DATE
          </span>
          <p className="font-mono text-3xl font-bold text-[#2D5A43]">
            {formatPKR(totalPaid)}
          </p>
          <p className="text-[11px] text-[#58655E]">
            {payments.length} verified transaction receipts on file
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase text-[#58655E]">
            CURRENT OUTSTANDING
          </span>
          <p
            className={`font-mono text-3xl font-bold ${
              outstandingBalance > 0 ? "text-[#8E3E33]" : "text-[#2D5A43]"
            }`}
          >
            {formatPKR(outstandingBalance)}
          </p>
          <p className="text-[11px] text-[#58655E]">
            {outstandingBalance > 0
              ? "Pending settlement for current active ledger"
              : "All accounts fully cleared ✓"}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#58655E]">
            OFFICIAL RECEIPT STATUS
          </span>
          <div className="flex items-center gap-2 text-base font-bold text-[#17211D] pt-1">
            <CheckCircle2 size={20} className="text-[#2D5A43]" />
            <span>Digital Receipts Active</span>
          </div>
          <p className="text-[11px] text-[#58655E]">
            Every payment receives an instant unique receipt code.
          </p>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#E8EDD9] border border-[#CBD4BC]">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#58655E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, date, method..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#CBD4BC] bg-[#FAF6F0] text-xs text-[#17211D] focus:border-[#FF704D]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterType === cat
                  ? "bg-[#17211D] text-[#F4F7F2] shadow-xs"
                  : "bg-[#FAF6F0] border border-[#CBD4BC] text-[#58655E] hover:text-[#17211D]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-3xl bg-[#FAF6F0] border border-[#CBD4BC] shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={32} className="mx-auto text-[#58655E]" />
            <h4 className="text-sm font-bold text-[#17211D]">No Payment Receipts Found</h4>
            <p className="text-xs text-[#58655E]">
              {payments.length === 0
                ? "When payments are recorded by plaza management, official receipts appear here immediately."
                : "No payments match your current search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#E8EDD9] text-[10px] uppercase font-semibold text-[#58655E] border-b border-[#CBD4BC]">
                <tr>
                  <th className="p-4">Receipt #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Amount (PKR)</th>
                  <th className="p-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD4BC]/60">
                {filteredPayments.map((p) => {
                  const CatIcon = categoryIcons[p.payment_type || "RENT"] || Building2;
                  return (
                    <tr key={p.id} className="hover:bg-[#E8EDD9]/40 transition">
                      <td className="p-4 font-bold text-[#17211D]">
                        {p.receipt_number || `RCP-${p.id}`}
                      </td>
                      <td className="p-4 text-[#58655E]">{p.payment_date}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8EDD9] border border-[#CBD4BC] text-[10px] font-bold text-[#17211D] uppercase">
                          <CatIcon size={11} />
                          <span>{p.payment_type || "RENT"}</span>
                        </span>
                      </td>
                      <td className="p-4 text-[#58655E]">
                        {p.payment_method}
                        {p.transaction_reference ? ` (${p.transaction_reference})` : ""}
                      </td>
                      <td className="p-4 text-right font-bold text-[#2D5A43] text-sm">
                        {formatPKR(p.amount)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17211D] text-[#F4F7F2] text-xs font-sans font-semibold hover:bg-[#24332D] transition shadow-xs cursor-pointer"
                        >
                          <Receipt size={12} />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receiptNumber={selectedReceipt.receiptNumber}
          paymentDate={selectedReceipt.paymentDate}
          paymentAmount={selectedReceipt.paymentAmount}
          paymentType={selectedReceipt.paymentType}
          paymentMethod={selectedReceipt.paymentMethod}
          transactionReference={selectedReceipt.transactionReference}
          notes={selectedReceipt.notes}
          tenantName={selectedReceipt.tenantName}
          shopName={selectedReceipt.shopName}
          referenceNumber={selectedReceipt.referenceNumber}
          billingMonth={selectedReceipt.billingMonth}
          rentAmount={selectedReceipt.rentAmount}
          totalPayable={selectedReceipt.totalPayable}
          totalPaid={selectedReceipt.totalPaid}
          remainingBalance={selectedReceipt.remainingBalance}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Notify Admin of Payment Modal */}
      <TenantNotifyPaymentModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        defaultAmount={outstandingBalance > 0 ? outstandingBalance : monthlyRent}
        unitName={shopName}
        tenantName={tenantName}
      />
    </div>
  );
}
