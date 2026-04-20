import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { createWorkOrder } from "../../services/workOrders";
import { getUserAssociatedAccounts } from "../../services/accounts";

const filter = createFilterOptions();

export default function CreateWorkOrder() {
    const navigate = useNavigate();
    const auth = getAuth();

    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [orderType, setOrderType] = useState("Shelf Strips");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [addAccountOpen, setAddAccountOpen] = useState(false);
    const [newAccountName, setNewAccountName] = useState("");

    useEffect(() => {
        async function loadAccounts() {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            try {
                const data = await getUserAssociatedAccounts(currentUser.uid);
                console.log("associatedAccounts result:", data)
                setAccounts(Array.isArray(data) ? data : []);
            } catch (err) {
                setError("Failed to load accounts.");
            }
        }
        loadAccounts();
    }, [auth]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const currentUser = auth.currentUser;

        if (!currentUser) {
            setError("You must be signed in to create a work order");
            return;
        }

        try {
            setIsSaving(true);

            await createWorkOrder({
                userId: currentUser.uid,
                requestedBy: currentUser.displayName || "",
                account: selectedAccount?.account ||
                selectedAccount?.accountName ||
                "",
                accountId: selectedAccount?.id ||
                selectedAccount?.accountId ||
                selectedAccount?.accountID ||
                "",
                orderType,
            });

            navigate("/workorders");
        } catch(err) {
            setError(err.message || "Failed to create work order.");
        } finally {
            setIsSaving(false);
        }
    }    

    return (
        <Box sx={{ maxWidth: 700 }}>
            <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h5">Create Work Order</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Basic shelf strip Creation
                        </Typography>
                    </Box>

                    {error ? <Alert severity="error">{error}</Alert> : null}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                select
                                label="Order Type"
                                value={orderType}
                                onChange={(event) => setOrderType(event.target.value)}
                                fullWidth
                            >
                                <MenuItem value="Shelf Strips">Shelf Strips</MenuItem>
                            </TextField>

                            <Autocomplete
                                freeSolo
                                options={accounts}
                                value={selectedAccount}
                                onChange={(event, newValue) => {
                                    if (newValue?.inputValue) {
                                    setNewAccountName(newValue.inputValue);
                                    setAddAccountOpen(true);
                                    return;
                                    }

                                    setSelectedAccount(newValue);
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filter(options, params);
                                    const { inputValue } = params;

                                    const isExisting = options.some((option) => {
                                    const optionLabel =
                                        option?.account || option?.accountName || option?.name || "";
                                    return optionLabel.toLowerCase() === inputValue.toLowerCase();
                                    });

                                    if (inputValue !== "" && !isExisting) {
                                    filtered.push({
                                        inputValue,
                                        label: `Add "${inputValue}"`,
                                    });
                                    }

                                    return filtered;
                                }}
                                getOptionLabel={(option) => {
                                    if (typeof option === "string") return option;
                                    if (option?.inputValue) return option.label || option.inputValue;
                                    return option?.account || option?.accountName || option?.name || "";
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    const optionId = option?.id || option?.accountId || option?.accountID || "";
                                    const valueId = value?.id || value?.accountId || value?.accountID || "";
                                    return String(optionId) === String(valueId);
                                }}
                                selectOnFocus
                                clearOnBlur
                                handleHomeEndKeys
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    label="Account"
                                    required
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        {option?.label ||
                                        option?.account ||
                                        option?.accountName ||
                                        option?.name ||
                                        ""}
                                    </li>
                                )}
                            />                           
                            
                            <Stack direction="row" spacing={2}>
                                <Button type="submit" variant="contained" disabled={isSaving}>
                                    {isSaving ? "Creating..." : "Create"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={() => navigate("/workorders")}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
            <Dialog
                open={addAccountOpen}
                onClose={() => setAddAccountOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Add Account</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Account Creation will be wired next
                        </Typography>
                        <TextField
                            label="Account Name"
                            value={newAccountName}
                            onChange={(event) => setNewAccountName(event.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddAccountOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" disabled>
                        Save Account
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}