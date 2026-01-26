import React from "react";
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";

function Page({ name }) {
  return <h2>{name}</h2>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
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
            <Route path="/workorders" element={<Page name="Work Orders" />} />
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
  </React.StrictMode>
)
