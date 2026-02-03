import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogTitle, DialogContent, IconButton, Typography, Stack, Chip, Divider, Grid } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWorkOrderById } from "../services/workOrders";
import ShelfStripsBody from "./shelfstrips/ShelfStripsBody";

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

function formatShortDate(v) {
  try {
    if (v?.toDate) v = v.toDate();
    if (typeof v?.seconds === "number") v = new Date(v.seconds * 1000);
    if (typeof v === "string") v = new Date(v);
    if (!(v instanceof Date) || isNaN(v)) return "—";

    return v.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "2-digit",
    }).replace(",", "");
  } catch {
    return "—";
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
    const headerDate = wo?.dueDate ? formatMaybeTimestamp(wo.dueDate) : "";

    const items = Array.isArray(wo?.items) ? wo.items : [];

    const itemTotals = useMemo(() => {
        const lineCount = wo?.lineCount ?? items.length;
        const stripCount = wo?.stripCount;
        const cost = wo?.cost;
        return { lineCount, stripCount, cost };

    }, [wo, items.length]);

    const isShelfStrips = String(wo?.orderType || "").toLowerCase() === "shelf strips";

    return (
        <Dialog open onClose={handleClose} fullWidth maxWidth="lg">
            <DialogTitle sx={{ pr: 6, backgroundColor: "rgba(229,239,247,1)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">                    
                    <Typography variant="h6" fontWeight={700} color="#4e5262">
                        #{headerId}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontSize="0.875rem" fontWeight={500} color="#4e5262">
                            {formatShortDate(wo?.dueDate)}
                        </Typography>                                               
                    
                        <IconButton aria-label="close" onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>                        
                    </Stack>                   
                </Stack>                            
            </DialogTitle>
            {/* Adjust height of content possibly */}
            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "75vh" }}>
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
                                    <Typography variant="h3" fontWeight={300} sx={{ lineHeight: 1.1, maxWidth: { xs: "100%", md: 560 }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}} >
                                        {wo.account || "Untitled Account"}
                                    </Typography>                                   
                                </Box>
                                
                            </Stack>
                            <Box sx={{ minWidth: 340 }}>
                                <Grid container columnSpacing={2} rowSpacing={0.5}>                                    
                                    <Grid size={{ xs: 12 }}>                                        
                                        <Typography variant="subtitle2" sx={{ color: "rgba(0,0,0,0.87)", fontWeight: "400" }}>
                                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1}}>
                                                WO TYPE:
                                            </Box>                                            
                                                {wo.orderType || "N/A"}                                                                                       
                                        </Typography>                                        
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>                                        
                                        <Typography variant="subtitle2" sx={{ color: "rgba(0,0,0,0.87)", fontWeight: "400" }}>
                                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1}}>
                                                CREATED BY:
                                            </Box>                                            
                                                {wo.requestedBy || "N/A"}                                                                                       
                                        </Typography>                                        
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>                                        
                                        <Typography variant="subtitle2" sx={{ color: "rgba(0,0,0,0.87)", fontWeight: "400" }}>
                                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1}}>
                                                CREATED ON:
                                            </Box>                                            
                                                {formatMaybeTimestamp(wo.createdAt) || "N/A"}                                                                                       
                                        </Typography>                                        
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>                                        
                                        <Typography variant="subtitle2" sx={{ color: "rgba(0,0,0,0.87)", fontWeight: "400", }}>
                                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1}}>
                                                ASSIGNED TO:
                                            </Box>                                            
                                                {wo.assignedToName || "N/A"}                                                                                       
                                        </Typography>                                        
                                    </Grid>                                    
                                    <Grid size={{ xs: 12, sm: 6 }}>                                        
                                        <Typography variant="subtitle2" sx={{ color: "rgba(0,0,0,0.87)", fontWeight: "400" }}>
                                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1}}>
                                                DUE ON:
                                            </Box>                                            
                                                {formatMaybeTimestamp(wo.dueDate) || "N/A"}                                                                                       
                                        </Typography>                                        
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>                                        
                                        <Typography variant="subtitle2" sx={{ color: "rgba(0,0,0,0.87)", fontWeight: "400", textTransform: "capitalize" }}>
                                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1}}>
                                                STATUS:
                                            </Box>                                            
                                                {wo.status || "N/A"}                                                                                       
                                        </Typography>                                        
                                    </Grid>
                                    {wo.isRush && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Chip label="PLEASE RUSH" color="error" size="small" sx={{ borderRadius: 1, fontWeight: 600 }} />                                             
                                        </Grid>
                                    )}                                    
                                    
                                </Grid>
                            </Box>

                            <Divider />

                            {/* Line items list */}
                            {isShelfStrips ? (
                                <ShelfStripsBody wo={wo} money={money} />
                            ) : ( 
                                <Typography variant="body2" color="text.secondary">
                                    No renderer yet for this work order type.
                                </Typography>
                            )}                            
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