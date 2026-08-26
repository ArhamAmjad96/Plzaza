interface StatusBadgeProps {
  status: "PAID" | "PENDING" | "OVERDUE" | "OCCUPIED" | "VACANT" | "OPEN" | "IN_PROGRESS" | "FIXED" | "INACTIVE" | string;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const norm = status.toUpperCase();

  let dotColor = "bg-[#58655E]";
  let textColor = "text-[#58655E]";
  let bgColor = "bg-[#DDE4CF]";
  let border = "border-[#CBD4BC]";
  let displayLabel = label || status;

  switch (norm) {
    case "PAID":
    case "OCCUPIED":
    case "FIXED":
    case "RESOLVED":
    case "ACTIVE":
      dotColor = "bg-[#2D5A43]";
      textColor = "text-[#2D5A43]";
      bgColor = "bg-[#E3EFE8]";
      border = "border-[#BCD8C7]";
      if (!label) {
        displayLabel = norm === "OCCUPIED" ? "Occupied" : norm === "FIXED" ? "Resolved" : "Paid";
      }
      break;

    case "PENDING":
    case "PARTIAL":
    case "IN_PROGRESS":
    case "ASSIGNED":
      dotColor = "bg-[#8C6B32]";
      textColor = "text-[#8C6B32]";
      bgColor = "bg-[#F9F1E2]";
      border = "border-[#E8D3B0]";
      if (!label) {
        displayLabel = norm === "IN_PROGRESS" ? "In Progress" : norm === "PARTIAL" ? "Partially Paid" : "Pending";
      }
      break;

    case "OVERDUE":
    case "UNPAID":
    case "OPEN":
    case "CRITICAL":
    case "HIGH":
      dotColor = "bg-[#8E3E33]";
      textColor = "text-[#8E3E33]";
      bgColor = "bg-[#FAECE9]";
      border = "border-[#EBC1BA]";
      if (!label) {
        displayLabel = norm === "UNPAID" ? "Unpaid" : norm === "OPEN" ? "Open Issue" : "Overdue";
      }
      break;

    case "VACANT":
      dotColor = "bg-[#FF704D]";
      textColor = "text-[#FF704D]";
      bgColor = "bg-[#FFF0EB]";
      border = "border-[#FFD4C7]";
      if (!label) {
        displayLabel = "Vacant";
      }
      break;

    case "INACTIVE":
    default:
      dotColor = "bg-[#58655E]";
      textColor = "text-[#58655E]";
      bgColor = "bg-[#DDE4CF]";
      border = "border-[#CBD4BC]";
      if (!label) {
        displayLabel = norm === "INACTIVE" ? "Inactive" : "Neutral";
      }
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold tracking-tight shadow-xs ${bgColor} ${textColor} ${border} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
}
