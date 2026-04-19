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

export function formatRelativeTime(timestamp) {
    if (!timestamp?.seconds) return "";

    const nowMs = Date.now();
    const timeMs = timestamp.seconds * 1000;
    const diffMs = nowMs - timeMs;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return "Just Now";

    if (diffMs < hour) {
        const minutes = Math.floor(diffMs / minute);
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`; 
    }

    if (diffMs < day) {
        const hours = Math.floor(diffMs / hour);
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(diffMs / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;

}
