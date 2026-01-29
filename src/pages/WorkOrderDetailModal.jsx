import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogTitle, DialogContent, IconButton, Typography, Stack, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWorkOrderById } from "../services/workOrders";
import { Close } from "@mui/icons-material";

function formatMaybeTimestamp(v) {
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

function statusChipProps(status) {
  const s = String(status || "").toLowerCase();
  if (s === "open") return { color: "info", label: "OPEN" };
  if (s === "completed" || s === "complete") return { color: "success", label: "COMPLETED" };
  if (s === "held" || s === "hold") return { color: "warning", label: "HELD" };
  return { color: "default", label: (status || "UNKNOWN").toUpperCase() };
}

function money(v) {
  const n = Number(v);
  if (!isFinite(n)) return v ?? "";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
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

    const headerId = wo?.workorderNumber || wo?.id || id;
    const headerDate = wo?.createdAt ? formatMaybeTimestamp(wo.createdAt) : "";

    const items = Array.isArray(wo?.items) ? wo.items : [];

    const itemTotals = useMemo(() => {
        const lineCount = wo?.lineCount ?? items.length;
        const stripCount = wo?.stripCount;
        const cost = wo?.cost;
        return { lineCount, stripCount, cost };

    }, [wo, items.length]);

    return (
        <Dialog open onClose={handleClose} fullWidth maxWidth="lg">
            <DialogTitle sx={{ pr: 6 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack spacing={0.25}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            #{headerId}
                        </Typography>
                        {!!headerDate && (
                            <Typography variant="caption" color="text.secondary">
                                Created: {headerDate}
                            </Typography>
                        )}                        
                    </Stack>
                    <IconButton aria-label="close" onClick={handleClose}>
                    <   CloseIcon />
                    </IconButton>
                </Stack>                            
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {loading && (
                    <Box sx={{ p: 3 }}>
                        <Typography>Loading...</Typography>
                    </Box>
                )}
                {err && (
                    <Box sx={{ p:3 }}>
                        <Typography color="error">{err}</Typography>
                    </Box>
                )}
                {!loading && !err && !wo && (
                    <Box sx={{ p:3 }}>
                        <Typography>Work Order Not Found.</Typography>
                    </Box>
                )}

                {!loading && !err && wo && (
                    <Box sx={{ p: 3 }}>
                        <Stack spacing={1.25}>
                            <Stack direction={{ xs: "column", md: "row"}} justifyContent="space-between" spacing={2}>
                                <Box>
                                    <Typography variant="h4" fontWeight={300} sx={{ lineHeight: 1.1}} >
                                        {wo.account || "Untitled Account"}
                                    </Typography>

                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                        <Chip size="small" variant="outlined" label={`WO TYPE: ${wo.orderType} || "-"}`} />
                                        <Chip size="small" {...statusChipProps(wo.status)} />
                                        {wo.isRush && <Chip size="small" color="error" label="RUSH" />}                                        
                                    </Stack>
                                </Box>
                                <Stack direction="row" spacing={3} alignItems="flex-end" sx={{ minWidth: 260 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Lines
                                        </Typography>
                                        <Typography variant="h4" fontWeight={300}>
                                            {itemTotals.lineCount ?? "-"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Strips
                                        </Typography>
                                        <Typography variant="h4" fontWeight={300}>
                                            {itemTotals.stripCount ?? "-"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Cost
                                        </Typography>
                                        <Typography variant="h6" fontWeight={500}>
                                            {money(itemTotals.cost)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Stack>

                            <Divider />

                            {/* Line items list */}
                            <Typography>
                                Items
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: 70 }}><b>QTY</b></TableCell>
                                        <TableCell><b>ITEM</b></TableCell>
                                        <TableCell sx={{ width: 140 }}><b>PACKAGE</b></TableCell>
                                        <TableCell sx={{ width: 110 }} align="right"><b>PRICE</b></TableCell>
                                        <TableCell sx={{ width: 130 }}><b>EXTRA</b></TableCell>                                        
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((it) => (
                                      <TableRow key={it.id ?? `${it.brand}-${it.pkg}-${it.price}`}>
                                        <TableCell>{it.quantity ?? ""}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {it.brand || "-"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {it.pkg || "-"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2">
                                                {money(it.price)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {it.extText || ""}
                                            </Typography>
                                        </TableCell>                                        
                                      </TableRow>  
                                    ))}

                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No Items on this work order.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Stack>                    
                    </Box>
                )}
                </DialogContent>

                <DialogActions sx={{ px:3, py: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                        <Button variant="contained" color="primary" disabled>
                            COMPLETE
                        </Button>
                        <Button variant="outlined" color="warning" disabled>
                            HOLD
                        </Button>
                        <Button variant="outlined" disabled>
                            EDIT ORDER
                        </Button>                       
                    </Stack>
                    <Button variant="contained" color="success" disabled>
                        GENERATE
                    </Button>
                </DialogActions>
        </Dialog>
    );
}