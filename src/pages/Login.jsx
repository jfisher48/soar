import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Paper} from "@mui/material";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("LOGIN SUBMIT FIRED");
        setError("");
        setSubmitting(true);
        try{
            await login(email.trim(), password);
            navigate("/dashboard", {replace: true});
        } catch (err) {
            setError(err?.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
        
    };

    return (
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2}}>
            <Paper sx={{ p: 3, width: "100%", maxWidth: 420}}>
                <Typography variant="h5" sx={{ mb:2 }}>
                    Sign in to Soar
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2}}>
                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        fullWidth
                    />

                    {error && (
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    )}

                    <Button type="submit" variant="contained" disabled={submitting}>
                        {submitting ? "Signing in.." : "Sign In"}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}