import { useEffect, useState } from "react";
import { fetchWorkOrders } from "../services/workOrders";
import { Card, CardContent, Typography, Chip, Stack } from "@mui/material";
import { Link, Outlet } from "react-router-dom";

function formatMaybeTimestamp(v) {
  try {
    // Firestore Timestamp instance
    if (v?.toDate) return v.toDate().toLocaleString();

    // Firestore serialized timestamp { seconds, nanoseconds }
    if (typeof v?.seconds === "number") {
      return new Date(v.seconds * 1000).toLocaleString();
    }

    // JS Date
    if (v instanceof Date) return v.toLocaleString();

    // Milliseconds number
    if (typeof v === "number") return new Date(v).toLocaleString();

    // ISO string
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleString();
    }

    return "";
  } catch {
    return "";
  }
}


export default function WorkOrders() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
        setLoading(true);
        setErr("");
        try{
            const data = await fetchWorkOrders({ pageSize: 25 });
            if (!cancelled) setRows(data);
        } catch (e) {
            if (!cancelled) setErr(e?.message || "Failed to load work orders.");
        } finally {
            if (!cancelled) setLoading(false);
        }
    })();
    
    return () => {
        cancelled = true;
    };
}, []);

return (
    <div>
        <h2>Work Orders</h2>
        {loading && <p>Loading...</p>}
        {err && <p>{err}</p>}

        {!loading && !err && rows.length === 0 && <p>No work orders found</p>}

        {!loading && !err && rows.length > 0 && (
            <div style ={{ display: "grid", gap: 12 }}>
                {rows.map((wo) => (
                    <Card
                        component={Link}
                        key={wo.id}
                        to={`/workorders/${wo.id}`}
                        sx={{
                            textDecoration: "none", 
                            color: "inherit",
                            "&:hover": { boxShadow: 4}
                        }}
                    >
                        <CardContent>
                            <Stack spacing ={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {wo.accountName || wo.account || wo.storeName || "Untitled Account"}
                                    </Typography>
                                    <Chip label={wo.status || "Unknown"} size="small" color={wo.status === "Completed" ? "success" : "default"} />                                    
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    {wo.type || wo.orderType || "Unknown type"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Updated: {formatMaybeTimestamp(wo.touchedAt) || "-"}
                                    {wo.assignedToName ? ` • ${wo.assignedToName}` : ""}
                                </Typography>
                            </Stack>
                        </CardContent>                    
                    </Card>
                ))}                
            </div>
        )}
        <Outlet />
    </div>
)

}