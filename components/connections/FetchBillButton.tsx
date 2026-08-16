"use client";

import { useState } from "react";

export default function FetchBillButton({
  referenceNumber,
}: {
  referenceNumber: string;
}) {
  const [loading, setLoading] = useState(false);

  async function fetchBill() {
    try {
      setLoading(true);

      const response = await fetch("/api/fetch-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bill.");
      }

      console.log("Bill fetched:", data);

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to fetch bill."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={fetchBill}
      disabled={loading}
      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Fetching..." : "Fetch Latest Bill"}
    </button>
  );
}