"use client";

import { deleteBill } from "@/app/bills/[id]/actions";

export default function DeleteBillButton({ billId }: { billId: string }) {
  return (
    <form
      action={deleteBill.bind(null, billId)}
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this bill?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        Delete Bill
      </button>
    </form>
  );
}
