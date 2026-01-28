import { useEffect, useState } from "react";
import { Box, Drawer, List, ListItemButton, ListItemText, Toolbar, AppBar, Typography, Divider, IconButton, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu"
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const drawerWidth = 220;

const navItems = [
    {label: "Dashboard", to: "/dashboard"},
    {label: "Work Orders", to: "/workorders"},
    {label: "Reports", to: "/reports"},
    {label: "News", to: "/news"},
    {label: "Logos", to: "/logos"},
    {label: "People", to: "/people"},
    {label: "Resources", to: "/resources"},
    {label: "Admin", to: "/admin"}    
];

console.log("AppLayout mounted")

export default function AppLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
    const isTablet = !isPhone && !isDesktop;

    const [drawerOpen, setDrawerOpen] = useState(() => {
        //default open on tablet/desktop, closed on phone
        const saved = localStorage.getItem("soar.drawerOpen");
        return saved ? saved === "true" : !isPhone;
    });

    useEffect(() => {
        // When switching between phone/non-phone, adjust default behavior
        if (isPhone) setDrawerOpen(false);
        if (!isPhone && localStorage.getItem("soar.drawerOpen") === null) setDrawerOpen(true);
    }, [isPhone]);

    useEffect(() => {
        localStorage.setItem("soar.drawerOpen", String(drawerOpen));
    }, [drawerOpen]);
    
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const drawerContent = (
        <Box>
            <Toolbar />
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        sx={{
                            "&.active": {
                                bgcolor: "action.selected",
                                fontWeight: 700,
                            }
                        }}
                    >
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );

    return(
        
       <Box sx={{ display: "flex"}}>        
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1}}>
            <Toolbar>
                {!isDesktop && (
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
        
        {isPhone && (
            <Drawer
                variant="temporary"
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
            >
                {drawerContent}
            </Drawer>
        )}

        {isTablet && (
            <Drawer
                variant="persistent"
                anchor="left"
                open={drawerOpen}
                sx={{ "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}            
            >
                {drawerContent}
            </Drawer>
        )}

        {isDesktop && (
            <Drawer
                variant="permanent"
                open
                sx={{ width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
            >
                {drawerContent}
            </Drawer>
        )}

        {/* Main Content */}
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                p: 3,
                ml: isDesktop ? `${drawerWidth}px` : isTablet && drawerOpen ? `${drawerWidth}px` : 0, transition: "margin-left 200ms ease" 
            }}
        >
            <Toolbar />
            <Outlet />
        </Box>
       </Box>
    );    
}