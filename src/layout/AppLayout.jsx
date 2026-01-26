import { Box, Drawer, List, ListItemButton, ListItemText, Toolbar, AppBar, Typography, Divider, IconButton, Stack } from "@mui/material";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const drawerWidth = 220;

const navItems = [
    {label: "Dashboard", to: "/dashboard"},
    {label: "Work Orders", to: "/workorders"},
    {label: "Reports", to: "/reports"},
    {label: "News", to: "/new"},
    {label: "Logos", to: "/logos"},
    {label: "People", to: "/people"},
    {label: "Resources", to: "/resources"},
    {label: "Admin", to: "/admin"}    
];

export default function AppLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return(
       <Box sx={{ display: "flex"}}>
        {/*Top bar */}
        <AppBar
            position="fixed"
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1}}
            >
                <Toolbar>
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
        {/*Left Drawer */}
        <Drawer>
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
        </Drawer>
        {/* Main Content */}
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                p: 3,
                ml: `${drawerWidth}px`
            }}
        >
            <Toolbar />
            <Outlet />
        </Box>
       </Box>
    );
}