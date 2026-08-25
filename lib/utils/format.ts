/**
 * Centralized Pakistani Rupee (PKR) Currency Formatter
 * 
 * Formats numbers into Pakistani Rupee format:
 * - 45000 -> "Rs. 45,000"
 * - 1250000 -> "Rs. 1,250,000"
 * - null/undefined/0 -> "Rs. 0"
 * 
 * Avoids trailing .00 decimals unless fractional cents exist.
 */
export function formatPKR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Rs. 0";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return "Rs. 0";
  }

  const isInteger = Number.isInteger(num);
  const formattedNumber = num.toLocaleString("en-IN", {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  });

  return `Rs. ${formattedNumber}`;
}

/**
 * Helper to format billing month dates into clean readable labels
 * e.g., '2026-08-01' -> 'August 2026'
 */
export function formatBillingMonth(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}
