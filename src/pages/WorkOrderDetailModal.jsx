import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Stack, Chip, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWorkOrderById } from "../services/workOrders";
import { Close } from "@mui/icons-material";

function formatMaybeTimestamp(v) {
  try {
    if (v?.toDate) return v.toDate().toLocaleString();
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

export default function WorkOrderDetailModal() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wo, setWo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const handleClose = () => navigate("..");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setErr("");
            try{
                const data = await fetchWorkOrderById(id);
                if (!cancelled) setWo(data);
            } catch (e) {
                if (!cancelled) setErr(e?.message || "Failed to load work order")
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id]);

    return (
        <Dialog open onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pr: 6 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                        Work Order {wo?.id && wo.id}
                    </Typography>
                    {wo?.status && <Chip size="small" label={wo.status}/>}
                    {wo?.type && <Chip size="small" variant="outlined" label={wo.type} />}
                </Stack>
                <IconButton aria-label="close" onClick={handleClose} sx={{ position: "aboslute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>            
            </DialogTitle>
            <DialogContent dividers>
                {loading && <Typography>Loading...</Typography>}
                {err && <Typography color="error">{err}</Typography>}
                {!loading && !err && !wo && <Typography>Not Found.</Typography>}

                {!loading && !err && wo && (
                    <Stack spacing={2}>
                        <Stack spacing={0.5}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {wo.accountName || wo.account || wo.storeName || "Untitled Account"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ID: {wo.id}
                            </Typography>
                        </Stack>
                        <Divider />
                        <Stack direction={{ xs: "column", sm: "row"}} spacing={2}>
                            <div>
                                <Typography variant="caption" color="text.secondary">
                                    Created
                                </Typography>
                                <Typography variant="body2">
                                    {formatMaybeTimestamp(wo.createdAt) || "-"}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="caption" color="text.secondary">
                                    Last updated:
                                </Typography>
                                <Typography variant="body2">
                                    {formatMaybeTimestamp(wo.touchedAt) || "-"}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="caption" color="text.secondary">
                                    Assigned to:
                                </Typography>
                                <Typography variant="body2">
                                    {wo.assignedToName || wo.assignedTo || "-"}
                                </Typography>
                            </div>
                        </Stack>
                        <Divider />
                        {/* Temporary raw dump */}
                        <Typography variant="subtitle2" fontWeight={700}>
                            Fields
                        </Typography>
                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(wo, null, 2)}
                        </pre>
                    </Stack>
                )}
            </DialogContent>

        </Dialog>
    )


}