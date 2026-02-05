export function formatMaybeTimestamp(v) {
  try {
    if (v?.toDate) return v.toDate().toLocaleString();
    if (typeof v?.seconds === "number") return new Date(v.seconds * 1000).toLocaleString();
    if (v instanceof Date) return v.toLocaleString();
    if (typeof v === "number") return new Date(v).toLocaleString();
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleString();
    }
    return "";
  } catch {
    return "";
  }
}

export function formatShortDate(v) {
  try {
    if (v?.toDate) v = v.toDate();
    if (typeof v?.seconds === "number") v = new Date(v.seconds * 1000);
    if (typeof v === "string") v = new Date(v);
    if (!(v instanceof Date) || isNaN(v)) return "—";

    return v
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "2-digit",
      })
      .replace(",", "");
  } catch {
    return "—";
  }
}
