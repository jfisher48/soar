import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext, useLocation } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogTitle, DialogContent, IconButton, Typography, Stack, Chip, Divider, Grid } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWorkOrderById, updateWorkOrderStatus } from "../services/workOrders";
import ShelfStripsBody from "./shelfstrips/ShelfStripsBody";
import { formatMaybeTimestamp, formatShortDate } from "../lib/dates";

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
    const { orders = [], updateWorkOrderInList } = useOutletContext() || {}; 
    const [wo, setWo] = useState(null);
    const location = useLocation();
    const backgroundLocation = location.state?.backgroundLocation;
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);

    const handleClose = () => {
        if (backgroundLocation) {
            navigate(-1);
        } else {
            navigate("/workorders");
        }
        };
    
    const participants = useMemo(() => {
    // start with whatever is already on the workorder, if present
    const base = Array.isArray(wo?.participants) ? wo.participants : [];

    // add the key “people involved” fields you already store
    const add = [
        wo?.requesterId,
        wo?.assignedTo,
    ];

    return Array.from(new Set([...base, ...add].filter(Boolean).map(String)));
    }, [wo?.participants, wo?.requesterId, wo?.assignedTo]);

    const applyPatchLocal = (patch) => {
        setWo((prev) => (prev ? { ...prev, ...patch }: prev));
        if (id) updateWorkOrderInList?.({ id, ...patch });
    };  

    const applyStatus = async (nextStatus) => {
        if (!id || !wo) return;

        setSaving(true);
        setErr("");

        const touchedAt = new Date();

        //TODO (later): use authenticated user for touchedBy
        const touchedBy = wo?.assignedToName || wo?.requestedBy || wo?.touchedBy || "";

        // Build ONE patch and reuse it
        const patch = {
            status: nextStatus,
            touchedAt,
            touchedBy,
            participants, //memoized array
        };

        try {
            await updateWorkOrderStatus(id, nextStatus, touchedBy, participants);

            applyPatchLocal(patch);

        } catch (e) {
            setErr(e?.message || "Failed to update work order.");
        } finally {
            setSaving(false);
        }
    };

    const fromList = useMemo(() => {
        if (!id) return null;
        return orders.find((o) => o.id === id) || null;
        }, [orders, id]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setErr("");

            // 1) Use list cache if available (NO loading flicker)
            if (fromList) {
            setWo(fromList);
            setLoading(false);
            return;
            }

            // 2) Deep link / not in list
            setLoading(true);
            setWo(null);

            try {
            const data = await fetchWorkOrderById(id);
            if (!cancelled) setWo(data);
            } catch (e) {
            if (!cancelled) setErr(e?.message || "Failed to load work order");
            } finally {
            if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        }, [id, fromList]);


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
    const status = String(wo?.status || "open").toLowerCase(); 

    return (
        <Dialog open={!!id} onClose={handleClose} fullWidth maxWidth="lg">
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
                        {status === "open" && (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disabled={!wo || saving}
                                    onClick={() => applyStatus("completed")}
                                >
                                    {saving ? "SAVING..." : "COMPLETE"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="warning"
                                    disabled={!wo || saving}
                                    onClick={() => applyStatus("held")}
                                >
                                    {saving ? "SAVING..." : "HOLD"}
                                </Button>
                            </>
                        )}

                        {status === "held" && (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disabled={!wo || saving}
                                    onClick={() => applyStatus("completed")}
                                >
                                    {saving ? "SAVING..." : "COMPLETE"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    disabled={!wo || saving}
                                    onClick={() => applyStatus("open")}
                                >
                                    REOPEN
                                </Button>
                            </>
                        )}

                        {status === "completed" && (
                            <Button
                                variant="outlined"
                                disabled={!wo || saving}
                                onClick={() => applyStatus("open")}
                            >
                                REOPEN
                            </Button>
                        )}

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