import "./index.css"
import React from "react";
import ReactDOM from "react-dom/client"
import { ThemeProvider, createTheme } from "@mui/material";
import { CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetailModal from "./pages/WorkOrderDetailModal";

function Page({ name }) {
  return <h2>{name}</h2>;
}

const theme = createTheme({
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    // lineHeight is usually per-variant in MUI v5/v7; keep defaults for now
  },
  palette: {
    primary: {
      light: "#4e5262",
      main: "#212432",
      dark: "#000a12",
      contrastText: "#fff",
    },
    secondary: {
      light: "#64c1ff",
      main: "#0091ea",
      dark: "#0064b7",
      contrastText: "#fff",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              {/* Protected */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Page name="Dashboard" />} />
                <Route path="/workorders" element={<WorkOrders />}>
                  <Route path=":id" element={<WorkOrderDetailModal />} />
                </Route>
                <Route path="/reports" element={<Page name="Reports" />} />
                <Route path="/news" element={<Page name="News" />} />
                <Route path="/logos" element={<Page name="Logos" />} />
                <Route path="/people" element={<Page name="People" />} />
                <Route path="/resources" element={<Page name="Resources" />} />
                <Route path="/admin" element={<Page name="Admin" />} />                                    
              </Route>
            </Routes>    
          </BrowserRouter>
        </AuthProvider>
      </CssBaseline>
    </ThemeProvider>
  </React.StrictMode>
)
