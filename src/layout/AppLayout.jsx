import { useEffect, useState } from "react";
import { Box, Button, Drawer, List, ListItemButton, ListItemText, Menu, MenuItem, Toolbar, AppBar, Typography, Divider, IconButton, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import siteNav from "../app/nav/siteNav.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import useNotifications from "../hooks/useNotifications.jsx";
import { formatRelativeTime } from "../lib/dates.js";

function getTimeMs(val) {
    if (!val) return 0;

    if (typeof val.toMillis === "function") {
        return val.toMillis();
    }

    if (typeof val.seconds === "number") {
        return val.seconds * 1000;
    }

    const parsed = new Date(val).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

const drawerWidth = 270;

const navItems = siteNav.filter((i) => !i.redirect).map((i) => ({
    label: i.sidebarName,
    to: i.path,
    svgbox: i.svgbox,
    hoverBg: i.hoverBg,
    mobile: i.mobile,
    admin: i.admin, 
    svgpath: i.svgpath
}));

export default function AppLayout() {
    const { logout, user } = useAuth();    
    const navigate = useNavigate();

    const theme = useTheme();    
    const isDesktop   = useMediaQuery(theme.breakpoints.up("lg"));

    
    const [profile, setProfile] = useState(null);

    const {
        notifications,
        loading: notificationsLoading,
        error: notificationsError,
    } = useNotifications({ user, profile });    

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            if (!user?.uid) return;

            try {
                const ref = doc(db, "users", user.uid);
                const snap = await getDoc(ref);

                if (!cancelled) {
                    setProfile(snap.exists() ? snap.data() : null);
                }
            } catch (e) {
                console.error("Failed to load profile", e);
                if (!cancelled) setProfile(null)
            }
        }

        loadProfile();
        return () => {
            cancelled = true;
        };
    }, [user?.uid]);

    const [userMenuEl, setUserMenuEl] = useState(null);
    const userMenuOpen = Boolean(userMenuEl);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const [notificationsOpen, setNotificationsOpen] = useState(false);    

    const lastSeenMs = getTimeMs(profile?.lastNotificationsSeenAt);
    
    const notificationCount = notifications.filter((n) => {
        const nTime = getTimeMs(n.time);
        return nTime > lastSeenMs;
    }).length;




    const handleOpenNotifications = async () => {
        setDrawerOpen(false);
        setNotificationsOpen(true);

        if (!user?.uid) return;

        const now = new Date();

        setProfile((prev) => ({
            ...(prev || {}),
            lastNotificationsSeenAt: now,
        }));

        try {
            await updateDoc(doc(db, "users", user.uid), {
                lastNotificationsSeenAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Failed to update lastNotificationsSeenAt", e);
        }
    };


    const closeNotifications = () => setNotificationsOpen(false);
    
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const renderNavIcon = (item) => (
        <Box
            component="svg"
            viewBox={item.svgbox}
            aria-hidden="true"
            sx={{
                width: 25,
                height: 25,
                flexShrink: 0,
                mr: "15px",
                display: "block",
                "& path": { fill: "currentColor"}
            }}
        >
            <path d={item.svgpath} />
        </Box>
    )

    const drawerContent = (
        <Box>
            {!isDesktop && <Toolbar />}
            {isDesktop && (
                <>
                    <Box sx={{ px: 3, height: 64, display: "flex", alignItems: "center" }}>
                        <Typography
                            sx={{
                                color: "#fff",
                                fontWeight: 800,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                fontSize: "1.05rem",
                                lineHeight: 1,
                            }}
                        >
                            SOAR
                        </Typography>
                    </Box>
                    <Divider sx={{ borderColor: "rgba(123,127,146,0.3)" }} />
                </>
            )}
            <Box onClick={(e) => setUserMenuEl(e.currentTarget)} sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", userSelect: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.10)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",                        
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        flexShrink: 0
                    }}
                >
                    {profile?.initials || "??"}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{
                            color:"#fff",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textTransform: "uppercase",
                            whiteSpace:"nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }}
                    >
                        {profile?.firstName} {profile?.lastName}
                    </Typography>                    
                </Box>                
                <ExpandMoreIcon sx={{ ml: "auto", fontSize: 20, opacity: 0.6, transition: "transform 150ms ease", transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}/>                
            </Box>
            <Divider sx={{ borderColor: "rgba(123,127,146,0.3)" }} />
            <List>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        end={item.to === "/dashboard"}
                        sx={{
                            mx: "15px",
                            mt: "10px",
                            px: "15px",
                            py: "13px",
                            borderRadius: "3px",
                            color: "#fff",
                            textTransform: "uppercase",                            
                            "& svg": {color: "rgba(255,255,255,0.25)"},
                            "& .MuiListItemText-primary" : {
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em"
                            },
                            "&:hover": {
                                bgcolor: item.hoverBg,
                                "& .MuiListItemText-primary": { color: "#fff"},
                                "& svg": { color: "rgba(255,255,255,0.50)"}
                            },
                            "&.active": {                                
                                bgcolor: "rgba(255,255,255,0.10)",
                                "& .MuiListItemText-primary": { color: "#fff", fontWeight: 600 },
                                "& svg": { color: "#fff" }                                
                            }
                        }}
                    >
                        {renderNavIcon(item)}
                        <ListItemText primary={item.label} sx={{ m:0 }} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );

    return(
        
       <Box sx={{ display: "flex", bgcolor: "rgba(240,243,246,1)" }}>        
        <AppBar
            position="fixed"
            sx={{
                display: isDesktop ? "none" : "flex",
                zIndex: (t) => t.zIndex.drawer + 1,
                bgcolor: "#212432",
                color: "#fff",
                boxShadow: "none",
            }}
        >
            <Toolbar sx={{ minHeight: 64 }}>
                {!isDesktop && (
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => {
                            setNotificationsOpen(false);
                            setDrawerOpen((v) => !v);
                        }}
                        sx={{ mr: 1 }}
                        aria-label="toggle drawer"
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                <Typography
                    variant="h6"
                    noWrap
                    sx={{
                        flexGrow: 1,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                    }}
                >
                    Soar
                </Typography>

                {!isDesktop && (
                    <IconButton
                        aria-label="open notifications"
                        onClick={handleOpenNotifications}
                        sx={{
                            position: "relative",
                            color: "#fff",
                            "&:hover": {
                                color: "#fff",
                                bgcolor: "rgba(255,255,255,0.06)",
                            },
                        }}
                    >
                        <NotificationsOutlinedIcon sx={{ fontSize: 28 }} />

                        {notificationCount > 0 && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 2,
                                    minWidth: 16,
                                    height: 16,
                                    px: 0.4,
                                    borderRadius: 999,
                                    bgcolor: "#0091EA",
                                    color: "#fff",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    lineHeight: "16px",
                                    textAlign: "center",
                                }}
                            >
                                {notificationCount}
                            </Box>
                        )}
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>

        {!isDesktop && (
            <Drawer
                variant="temporary"
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true}}
                sx={{
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        bgcolor: "#212432",
                        color: "#fff"
                    } 
                }}
            >
                {drawerContent}
            </Drawer>
        )}        

        {isDesktop && (
            <Drawer
                variant="permanent"
                open
                sx={{ flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", bgcolor: "#212432", color: "#fff", borderRight: "none" } }}
            >
                {drawerContent}
            </Drawer>
        )}

                {!isDesktop && (
            <Drawer
                anchor="bottom"
                open={notificationsOpen}
                onClose={closeNotifications}
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        maxHeight: "78vh",
                        overflow: "hidden",
                    },
                }}
            >
                <Box sx={{ px: 2, pt: 1.25, pb: 2 }}>
                    <Box
                        sx={{
                            width: 42,
                            height: 5,
                            borderRadius: 999,
                            bgcolor: "rgba(0,0,0,0.16)",
                            mx: "auto",
                            mb: 1.5,
                        }}
                    />

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1.5 }}
                    >
                        <Typography variant="h6" fontWeight={700}>
                            Notifications
                        </Typography>

                        <IconButton onClick={closeNotifications} aria-label="close notifications">
                            <CloseIcon />
                        </IconButton>
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
                                .map((item, index, arr) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            py: 1.5,
                                            borderBottom:
                                                index !== arr.length - 1
                                                    ? "1px dotted rgba(0,0,0,0.28)"
                                                    : "none",
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            alignItems="flex-start"
                                            justifyContent="space-between"
                                            spacing={1}
                                            sx={{ mb: 0.5 }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {String(item.user || "SYSTEM").toUpperCase()}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                                            >
                                                {formatRelativeTime(item.time)}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary">
                                            {item.content}
                                        </Typography>
                                    </Box>
                                ))}
                        </Stack>
                    )}

                    <Box sx={{ pt: 2 }}>
                        <Button fullWidth variant="outlined" onClick={closeNotifications}>
                            CLOSE
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        )}

        {/* Main Content */}
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                p: 0,
                ml: isDesktop ? `${drawerWidth}px` : 0,
                transition: "margin-left 200ms ease",
                bgcolor: "rgba(240,243,246,1)" 
            }}
        >       
            {!isDesktop && <Toolbar/>}
            <Outlet
                context={{
                    notifications,
                    notificationsLoading,
                    notificationsError
                }}
            />
        </Box>
        <Menu
            anchorEl={userMenuEl}
            open={userMenuOpen}
            onClose={() => setUserMenuEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}            
            slotProps={{
                list: {dense: true},
                paper: {
                    sx: {
                        mt: 1,
                        bgcolor: "#212432",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.10)",
                        minWidth: 180
                    }
                }
            }}
        >
            <MenuItem
                onClick={() => {
                    setUserMenuEl(null);
                    setTimeout(handleLogout, 0);
                }}
                sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    "&:hover": {bgcolor: "rgba(255,255,255,0.07)"}
                }}
            >
                Logout
            </MenuItem>
        </Menu>
       </Box>
    );    
}