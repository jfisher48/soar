import { useContext, useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getUserProfile } from "../services/accounts";
import { subscribeToOpenWorkOrders, subscribeToAggregatedWorkOrders } from "../services/workOrders";
import { AppBar, Box, Button, Card, CardContent, Chip, Divider, Fab, Grid, Stack, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Link, Outlet, useLocation, NavLink, useOutletContext } from "react-router-dom";
import { formatMaybeTimestamp, formatRelativeTime } from "../lib/dates";
import siteNav from "../app/nav/siteNav";
import WorkOrderFilterGroup from "../components/workorders/WorkOrderFilterGroup";

export default function WorkOrders() {
    const location = useLocation();

    const auth = getAuth();
    const [userRoutes, setUserRoutes] = useState([]);
    
    const {
        notifications = [],
        notificationsLoading = false,
        notificationsError = ""
    } = useOutletContext() || {};

    const [openOrders, setOpenOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [heldOrders, setHeldOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [listView, setListView] = useState("open");    

    const theme = useTheme();    
    const isDesktop   = useMediaQuery(theme.breakpoints.up("lg"));

    const navItem =  siteNav.find((i) => i.key === "workorders");

    // --- LAYOUT OFFSETS ---
    const PAGE_HEADER_H = 64;
    const MOBILE_FILTER_H = 64;
    const STATUSBAR_H = 75;
    const FIXED_TOP = PAGE_HEADER_H;

    const LIST_TOP_PADDING = isDesktop ? PAGE_HEADER_H : PAGE_HEADER_H + MOBILE_FILTER_H + 56;

    const drawerWidth = 270;    

    useEffect(() => {
        let unsubscribeOpen = null;
        let unsubscribeBucket = null;

        const init = async () => {
            setLoading(true);
            setErr("");

            try {
                const user = auth.currentUser;
                if (!user) throw new Error("No authenticated user.");

                const profile = await getUserProfile(user.uid);

                const routes = Array.isArray(profile.assignedRouteNumbers)
                    ? profile.assignedRouteNumbers.map(String)
                    : profile.routeNumber
                        ? [String(profile.routeNumber)]
                        : [];

                setUserRoutes(routes);

                unsubscribeOpen = subscribeToOpenWorkOrders({
                    routeNumbers: routes,
                    onUpdate: (data) => {
                        setOpenOrders(data);
                        if (listView === "open") setLoading(false);
                    },
                    onError: (error) => {
                        setErr(error?.message || "Failed to subscribe to open work orders.");
                        setLoading(false);
                    }
                });

                const bucket = listView;

                if (listView === "completed" || listView === "held") {
                    unsubscribeBucket = subscribeToAggregatedWorkOrders({
                        userId: user.uid,
                        bucket: listView,
                        onUpdate: (data) => {
                            if (bucket === "completed") {
                                setCompletedOrders(data);
                            } else {
                                setHeldOrders(data);
                            }
                            setLoading(false);
                        },
                        onError: (error) => {
                            setErr(error?.message || `Failed to subscribe to ${listView} work orders.`);
                            setLoading(false);
                        }
                    });
                }
            } catch (e) {
                setErr(e?.message || "Failed to initialize work orders.");
                setLoading(false);
            }
        };

        init();

        return () => {
            if (typeof unsubscribeOpen === "function") {
                unsubscribeOpen();
            }
            if (typeof unsubscribeBucket === "function") {
                unsubscribeBucket();
            }
        };
    }, [listView, auth]);

const updateWorkOrderInList = (patch) => {
    const applyPatch = (prev) =>
        prev.map((o) => (o.id === patch.id ? { ...o, ...patch } : o));

    setOpenOrders(applyPatch);
    setCompletedOrders(applyPatch);
    setHeldOrders(applyPatch);
}

const activeOrders = listView === "open" ? openOrders : listView === "completed" ? completedOrders: heldOrders;

const headingText = 
    listView === "open"
    ? "Open Orders"
    : listView === "completed"
    ? "Completed Orders"
    : "Held Orders";

return (
    <Box sx= {{ bgcolor: "rgba(240,243,246,1)", minHeight: "100vh", pt: 0, px: 3, pb: 3  }}>
        <AppBar position="fixed" elevation={0} sx={{ top: isDesktop ? 0 : 64, left: isDesktop ? drawerWidth : 0, width: isDesktop ? `calc(100% - ${drawerWidth}px)` : "100%", bgcolor: "rgba(240,243,246,1)", color: "inherit" }}>
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
                {isDesktop && (
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
            {!isDesktop && (
                <Box sx={{ px: 3, pb: 3}}>
                    <WorkOrderFilterGroup
                        listView={listView}
                        onChange={setListView}
                        fullWidth
                    />
                </Box>
            )}
        </AppBar>        
        {/* Desktop Heading Row & Fixed Sidebar */}
        
        {/* Main Content (DESKTOP = 2/3 + 1/3, MOBILE = full width) */}
        <Grid
            container
            spacing={2}
            sx={{
                mt: 0,
                // push content below the fixed Work Orders bar (your page AppBar is 64px tall)
                pt: `${LIST_TOP_PADDING}px`                
            }}
        >
        {/* LEFT: Status bar + Cards (2/3 on desktop) */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ minWidth: 0, pt: 0 }}>
            {/* Sticky Status/Filter Bar (aligned to card column) */}
            {isDesktop && (
            <Box
                sx={{
                position: "sticky",
                top: FIXED_TOP, 
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
                    <WorkOrderFilterGroup
                        listView={listView}
                        onChange={setListView}
                    />                    
                </Box>
            </Box>
            )}

            {/* Cards */}
            {loading && <Typography>Loading...</Typography>}
            {err && <Typography color="error">{String(err).toUpperCase()}</Typography>}
            {!loading && !err && activeOrders.length === 0 && <Typography>NO WORK ORDERS FOUND</Typography>}

            {!loading && !err && activeOrders.length > 0 && (            
                <Box
                    key={listView}
                    sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    animation: "workOrderFade 440ms ease",
                    "@keyframes workOrderFade": {
                        from: {
                            opacity: 0,
                            transform: "translateY(6px)"
                        },
                        to: {
                            opacity: 1,
                            transform: "translateY(0)"
                        }
                    }                
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
                        key={wo.id || wo.workorderNumber}
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
        {isDesktop && (
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
                        <Typography
                            variant="h1"
                            fontWeight={300}
                            onClick={() => setListView("open")}
                            sx={{
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                    color: "#0091EA"
                                }
                            }}
                        >
                            {openOrders.length}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            Open Orders
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                        <Typography
                            variant="h1"
                            fontWeight={300}
                            onClick={() => setListView("completed")}
                            sx={{
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                    color: "#0091EA"
                                }
                            }}
                        >
                            {completedOrders.length}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            Completed This Week
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                        <Typography
                            variant="h1"
                            fontWeight={300}
                            onClick={() => setListView("held")}
                            sx={{
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                    color: "#0091EA"
                                }
                            }}
                        >
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
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1.5 }}
                    >
                        <Typography variant="h4" fontWeight={500}>
                            Notifications
                        </Typography>
                        <Button
                            size="small"                            
                            sx={{
                                minWidth: 0,
                                px: 0,
                                fontWeight: 700,
                                color: "#0091ea"
                            }}
                        >
                            VIEW ALL
                        </Button>
                    </Stack>
                    {notificationsLoading && (
                        <Typography variant="body2" color="text.secondary">
                            Loading notifications...
                        </Typography>
                    )}

                    {!notificationsLoading && notificationsError && (
                        <Typography variant="body2" color="error">
                            {notificationsError}
                        </Typography>
                    )}

                    {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            No notifications yet.
                        </Typography>
                    )}

                    {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                        <Stack spacing={0}>
                            {notifications
                                .filter((item) => item?.id)
                                .slice(0, 5)
                                .map((item, index, arr) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            py: 1.5,
                                            borderBottom: 
                                                index !== arr.length - 1
                                                    ? "1px dotted rgba(0,0,0,0.12)"
                                                    : "none"
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            alignItems="flex-start"
                                            justifyContent="space-between"
                                            spacing={1}
                                            sx={{ mb: 0.5 }}
                                        >
                                            <Typography variant="body2" sx={{ pr:1 }}>
                                                <Box component="span" sx={{ fontWeight: 700 }}>
                                                    {item.user || "System"}
                                                </Box>{" "}
                                                {item.content}
                                            </Typography>

                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                                {formatRelativeTime(item.time)}
                                            </Typography>
                                        </Stack>                                    
                                    </Box>
                                )                            
                            )}
                        </Stack>
                    )}
                </Box>
                </Stack>
            </Box>
            </Grid>
        )}
        </Grid>

        {/* Mobile FAB */}
        {!isDesktop && (
            <Fab component={NavLink} to="/workorders/create" color="secondary" sx={{ position: "fixed", right: 16, bottom: 16 }}>
                <AddIcon />
            </Fab>
        )}

        <Outlet context={{ openOrders, completedOrders, heldOrders, updateWorkOrderInList }}/>
    </Box>
)

}