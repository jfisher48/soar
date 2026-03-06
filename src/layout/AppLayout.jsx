import { useEffect, useState } from "react";
import { Box, Drawer, List, ListItemButton, ListItemText, Menu, MenuItem, Toolbar, AppBar, Typography, Divider, IconButton, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import siteNav from "../app/nav/siteNav.js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

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

console.log(navItems)

console.log("AppLayout mounted")

export default function AppLayout() {
    const { logout, user } = useAuth();    
    const navigate = useNavigate();

    const theme = useTheme();
    const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
    const isMdUp   = useMediaQuery(theme.breakpoints.up("md"));
    const isLgUp   = useMediaQuery(theme.breakpoints.up("lg"));

    const [profile, setProfile] = useState(null);

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

    const [drawerOpen, setDrawerOpen] = useState(() => {
        //default open on tablet/desktop, closed on phone
        const saved = localStorage.getItem("soar.drawerOpen");
        return saved ? saved === "true" : !isSmDown;
    });

    useEffect(() => {
        // When switching between phone/non-phone, adjust default behavior
        if (isSmDown) setDrawerOpen(false);
        if (!isSmDown && localStorage.getItem("soar.drawerOpen") === null) setDrawerOpen(true);
    }, [isSmDown]);

    useEffect(() => {
        localStorage.setItem("soar.drawerOpen", String(drawerOpen));
    }, [drawerOpen]);
    
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
            {isSmDown && <Toolbar />}
            <Box sx={{ px:3, height: 64, display: "flex", alignItems: "center" }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "1.05rem", lineHeight: 1}}>
                    SOAR
                </Typography>                
            </Box>
            <Divider sx={{ borderColor: "rgba(123,127,146,0.3)" }} />
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
        <AppBar position="fixed" sx={{ display: { xs: "flex", lg: "none" }, zIndex: (t) => t.zIndex.drawer + 1}}>
            <Toolbar>
                {!isLgUp && (
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen((v) => !v)}
                        sx={{ mr: 1}}
                        aria-label="toggle drawer"
                    >
                        <MenuIcon />
                    </IconButton> 
                )}
                <Typography variant="h6" noWrap sx={{ flexGrow: 1}}>
                    Soar
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption">
                        {user?.email}
                    </Typography>
                    <IconButton color="inherit" onClick={handleLogout}>
                        Logout
                    </IconButton>
                </Stack>
            </Toolbar>
        </AppBar>
        
        {!isMdUp && (
            <Drawer
                variant="temporary"
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", bgcolor: "#212432", color: "#fff" } }}
            >
                {drawerContent}
            </Drawer>
        )}

        {isMdUp && !isLgUp && (
            <Drawer
                variant="persistent"
                anchor="left"
                open={drawerOpen}
                sx={{ flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", bgcolor: "#212432", color: "#fff" } }}            
            >
                {drawerContent}
            </Drawer>
        )}

        {isLgUp && (
            <Drawer
                variant="permanent"
                open
                sx={{ flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", bgcolor: "#212432", color: "#fff", borderRight: "none" } }}
            >
                {drawerContent}
            </Drawer>
        )}

        {/* Main Content */}
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                p: 0,
                ml: isLgUp ? `${drawerWidth}px` : isMdUp && !isLgUp && drawerOpen ? `${drawerWidth}px` : 0, transition: "margin-left 200ms ease",
                bgcolor: "rgba(240,243,246,1)" 
            }}
        >
            {isLgUp && <Toolbar />}
            <Outlet />
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