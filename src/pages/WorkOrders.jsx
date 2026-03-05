import { useEffect, useMemo, useState } from "react";
import { fetchWorkOrders } from "../services/workOrders";
import { AppBar, Box, Button, ButtonGroup, Card, CardContent, Chip, Divider, Fab, Grid, Stack, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Link, Outlet, useLocation, NavLink } from "react-router-dom";
import { formatMaybeTimestamp } from "../lib/dates";
import siteNav from "../app/nav/siteNav";

export default function WorkOrders() {
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [listView, setListView] = useState("open");

    const theme = useTheme();
    const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
    const isMdUp   = useMediaQuery(theme.breakpoints.up("md"));
    const isLgUp   = useMediaQuery(theme.breakpoints.up("lg"));

    const navItem =  siteNav.find((i) => i.key === "workorders");

    // --- LEGACY-LIKE FIXED CHROME (DESKTOP) ---
    const TOPBAR_H = isSmDown ? 64 : 0;        // global app top bar height
    const PAGEBAR_H = 64;       // WorkOrders page bar (your AppBar with "Work Orders")
    const STATUSBAR_H = 75;        // status bar height ("Open/Completed/Held" row)
    const FIXED_TOP = TOPBAR_H + PAGEBAR_H; // top position for status bar + sidebar

    const drawerWidth = 270;    
    const GUTTER = 24;

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setErr("");
            try {
            const data = await fetchWorkOrders({ pageSize: 25 });
            if (!cancelled) setOrders(data);
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

const updateWorkOrderInList = (patch) => {
    // patch: {id,status,touchedAt,touchedBy}
    setOrders((prev) =>
        prev.map((o) => (o.id === patch.id ? { ...o, ...patch } : o))
        );
}

const { openOrders, completedOrders, heldOrders } = useMemo(() => {
    const norm = (s) => String(s || "").toLowerCase();

    const openOrders = [];
    const completedOrders = [];
    const heldOrders = [];

    for (const o of orders) {
        const s = norm(o.status);   // <-- define s here
        if (s === "held" || s === "hold") heldOrders.push(o);
        else if (s === "completed" || s === "complete") completedOrders.push(o);
        else openOrders.push(o);
    }

    return { openOrders, completedOrders, heldOrders };    
}, [orders]);

const activeOrders = listView === "open" ? openOrders : listView === "completed" ? completedOrders: heldOrders;

const headingText = 
    listView === "open"
    ? "Open Orders"
    : listView === "completed"
    ? "Completed Orders"
    : "Held Orders";

return (
    <Box sx= {{ bgcolor: "rgba(240,243,246,1)", minHeight: "100vh", pt: 0, px: 3, pb: 3  }}>
        <AppBar position="fixed" elevation={0} sx={{ top: isSmDown ? 64 : 0, left: drawerWidth, width: `calc(100% -  ${drawerWidth}px)`, bgcolor: "rgba(240,243,246,1)", color: "inherit" }}>
            <Toolbar disableGutters sx={{ px: 3, justifyContent: "space-between"}}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: navItem?.hoverBg || "rgba(20,89,142,1)",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0
                        }}
                    >
                        <Box
                            component="svg"
                            viewBox={navItem?.svgbox}
                            aria-hidden="true"
                            sx={{
                                width: 22,
                                height: 22,
                                display: "block",
                                "& path": { fill: "#fff" }
                            }}
                        >
                            <path d={navItem?.svgpath}/>
                        </Box>
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                        Work Orders
                    </Typography>
                </Stack>
                {isLgUp && (
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" component={NavLink} to="/reports">
                            PRINT REPORTS
                        </Button>
                        <Button variant="outlined" component={NavLink} to="/workorders/create" startIcon={<AddIcon />}>
                            NEW ORDER
                        </Button>
                    </Stack>
                )}
            </Toolbar>
        </AppBar>                
        {/* Mobile Filter Bar */}
        {!isLgUp && (
            <AppBar position="sticky" elevation={0} sx={{ top: `${TOPBAR_H + PAGEBAR_H}px`, zIndex: (t) => t.zIndex.drawer + 1, bgcolor: "rgba(240,243,246,1)", mb: 2, mx: -1,
                px: 1,
                overflow: "hidden" }}>
                <Toolbar sx={{ px: 0, pb: 1}}>
                    <ButtonGroup fullWidth variant="outlined">
                        <Button onClick={() => setListView("open")} disabled={listView === "open"}>
                            OPEN
                        </Button>
                        <Button onClick={() => setListView("completed")} disabled={listView === "completed"}>
                            COMPLETED
                        </Button>
                        <Button onClick={() => setListView("held")} disabled={listView === "held"}>
                            HELD
                        </Button>
                    </ButtonGroup>
                </Toolbar>
            </AppBar>
        )}

        {/* Desktop Heading Row & Fixed Sidebar */}
        
        {/* Main Content (DESKTOP = 2/3 + 1/3, MOBILE = full width) */}
        <Grid
            container
            spacing={2}
            sx={{
                mt: 0,
                // push content below the fixed Work Orders bar (your page AppBar is 64px tall)
                pt: "64px",                
            }}
        >
        {/* LEFT: Status bar + Cards (2/3 on desktop) */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ minWidth: 0, pt: 0 }}>
            {/* Sticky Status/Filter Bar (aligned to card column) */}
            {isLgUp && (
            <Box
                sx={{
                position: "sticky",
                top: FIXED_TOP, // sits under global topbar + WorkOrders page bar
                zIndex: (t) => t.zIndex.drawer + 2,
                bgcolor: "rgba(240,243,246,1)",
                mx: -1,
                px: 1,
                overflow: "hidden"                               
                }}
            >
                <Box
                sx={{
                    height: STATUSBAR_H,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
                >
                <Typography variant="h4" fontWeight={500} sx={{ textTransform: "capitalize" }}>
                    {headingText}
                </Typography>

                <ButtonGroup variant="outlined">
                    <Button onClick={() => setListView("open")} disabled={listView === "open"}>
                    OPEN
                    </Button>
                    <Button onClick={() => setListView("completed")} disabled={listView === "completed"}>
                    COMPLETED
                    </Button>
                    <Button onClick={() => setListView("held")} disabled={listView === "held"}>
                    HELD
                    </Button>
                </ButtonGroup>
                </Box>
            </Box>
            )}

            {/* Cards */}
            {loading && <Typography>Loading...</Typography>}
            {err && <Typography color="error">{String(err).toUpperCase()}</Typography>}
            {!loading && !err && activeOrders.length === 0 && <Typography>NO WORK ORDERS FOUND</Typography>}

            {!loading && !err && activeOrders.length > 0 && (
            <Box
                sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                // IMPORTANT: remove pr/pt hacks; sticky bar now occupies space naturally
                }}
            >
                {activeOrders.map((wo) => {
                const account = wo.accountName || wo.account || wo.storeName || "UNTITLED ACCOUNT";
                const woNum = wo.workorderNumber || wo.id;
                const due = wo.dueDate ? formatMaybeTimestamp(wo.dueDate) : "";
                const createdOn = wo.createdAt ? formatMaybeTimestamp(wo.createdAt) : "";
                const createdBy = wo.requestedBy || "N/A";
                const assignedTo = wo.assignedToName || "N/A";
                const woType = wo.orderType || wo.type || "N/A";

                return (
                    <Card
                    component={Link}
                    key={wo.id}
                    to={`/workorders/${wo.id}`}
                    state={{ backgroundLocation: location }}
                    sx={{
                        textDecoration: "none",
                        color: "inherit",
                        borderRadius: 2,
                        overflow: "hidden",
                        "&:hover": { boxShadow: 4 },
                    }}
                    >
                    <Box sx={{ bgcolor: "rgba(229,239,247,1)", px: 2, py: 1, display: "flex", justifyContent: "space-between" }}>
                        <Typography fontWeight={600}>#{String(woNum).toUpperCase()}</Typography>
                        <Typography variant="body2" color="text.secondary">
                        {due ? String(due).toUpperCase() : ""}
                        </Typography>
                    </Box>

                    <CardContent>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        {account}
                        </Typography>

                        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1 }}>
                            WO TYPE:
                            </Box>
                            {woType}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1 }}>
                            CREATED BY:
                            </Box>
                            {createdBy}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1 }}>
                            CREATED ON:
                            </Box>
                            {createdOn || "N/A"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ color: "rgba(0,0,0,0.54)", mr: 1 }}>
                            ASSIGNED TO:
                            </Box>
                            {assignedTo}
                        </Typography>
                        </Stack>

                        <Divider sx={{ mb: 1.5 }} />

                        <Chip label={String(wo.status || "OPEN").toUpperCase()} size="small" sx={{ borderRadius: 1, fontWeight: 700 }} />
                    </CardContent>
                    </Card>
                );
                })}
            </Box>
            )}
        </Grid>

        {/* RIGHT: Sidebar (1/3 on desktop) */}
        {isLgUp && (
            <Grid size={{ xs: 12, lg: 4 }} sx={{ minWidth: 0, pt: 0 }}>
            <Box sx={{ position: "sticky", top: FIXED_TOP, bgcolor: "rgba(240,243,246,1)" }}>
                <Stack spacing={2}>
                    <Box sx={{ height: STATUSBAR_H, display: "flex", alignItems: "center"}}>
                        <Typography variant="h4" fontWeight={500}>
                            Totals
                        </Typography>
                    </Box>

                {/* Totals (flat, aligned with button group top) */}
                <Box sx={{ pb: 2, borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
                    <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                        <Typography variant="h1" fontWeight={300}>
                        {openOrders.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                        Open Orders
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                        <Typography variant="h1" fontWeight={300}>
                        {completedOrders.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                        Completed This Week
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                        <Typography variant="h1" fontWeight={300}>
                        {heldOrders.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                        Held Orders
                        </Typography>
                    </Grid>
                    </Grid>
                </Box>

                {/* Notifications (flat) */}
                <Box sx={{ pt: 1 }}>
                    <Typography variant="h4" fontWeight={500} sx={{ mb: 1 }}>
                    Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                    COMING SOON
                    </Typography>
                </Box>
                </Stack>
            </Box>
            </Grid>
        )}
        </Grid>
        {/* Mobile FAB */}
        {!isLgUp && (
            <Fab component={NavLink} to="/workorders/create" color="secondary" sx={{ position: "fixed", right: 16, bottom: 16 }}>
                <AddIcon />
            </Fab>
        )}
        <Outlet context={{ orders, updateWorkOrderInList }}/>
    </Box>
)

}