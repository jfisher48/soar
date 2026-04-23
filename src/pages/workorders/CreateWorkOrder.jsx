import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { createWorkOrder } from "../../services/workOrders";
import { createProvisionalAccount, getProvisionalAccountsByRoute, getUserAssociatedAccounts, getUserProfile } from "../../services/accounts";
import { buildAccountOptions, mapProvisionalAccountToOption } from "../../utils/accountOptions";


const filter = createFilterOptions();

export default function CreateWorkOrder() {
    const navigate = useNavigate();
    const auth = getAuth();

    const [accountOptions, setAccountOptions] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [newAccountCity, setNewAccountCity] = useState("");
    const [isSavingAccount, setIsSavingAccount] = useState(false);
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
        const profile = await getUserProfile(currentUser.uid);    
        const realAccounts = await getUserAssociatedAccounts(currentUser.uid);
        const provisionalAccounts = await getProvisionalAccountsByRoute(
            profile.routeNumber || ""
        );

        const mergedOptions = buildAccountOptions(
            Array.isArray(realAccounts) ? realAccounts : [],
            Array.isArray(provisionalAccounts) ? provisionalAccounts : []
        );

        console.log("associatedAccounts result:", realAccounts);
        console.log("provisionalAccounts result:", provisionalAccounts);

        setUserProfile(profile);
        setAccountOptions(mergedOptions);
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
                account: selectedAccount?.name || "",
                retailerId: selectedAccount?.isProvisional ? "" : selectedAccount?.id || "",
                provisionalAccountId: selectedAccount?.provisionalId || "",
                isProvisionalAccount: Boolean(selectedAccount?.isProvisional),
                routeNumber: selectedAccount.routeNumber || "",
                orderType,
            });

            navigate("/workorders");
        } catch(err) {
            setError(err.message || "Failed to create work order.");
        } finally {
            setIsSaving(false);
        }
    }
    
    function closeAddAccountDialog() {
        setAddAccountOpen(false);
        setNewAccountName("");
        setNewAccountCity("");
    }

    async function handleSaveProvisionalAccount() {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setError("You must be logged in to add an account");
            return;
        }

        if (!newAccountName.trim()) {
            setError("Account Name is required");
            return;
        }

        if (!userProfile?.routeNumber) {
            setError("Your user profile is missing a route number.");
            return;
        }

        try {
            setError("");
            setIsSavingAccount(true);

            const createdBy =
                `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() ||
                currentUser.displayName ||
                currentUser.email ||
                "";
            
            const provisionalAccount = await createProvisionalAccount({
                name: newAccountName,
                city: newAccountCity,
                routeNumber: userProfile.routeNumber,
                createdBy,
                createdByUid: currentUser.uid
            });

            const newOption = mapProvisionalAccountToOption(provisionalAccount);

            setAccountOptions((prev) => 
                [...prev, newOption].sort((a, b) => a.name.localeCompare(b.name))
            );

            setSelectedAccount(newOption);
            closeAddAccountDialog();
        } catch (err) {
            setError(err.message || "Failed to save account.");
        } finally {
            setIsSavingAccount(false);
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
                                options={accountOptions}
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
                                        const optionLabel = option?.name || option?.label || "";
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
                                    return option?.label || option?.name || "";
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    const optionKey =
                                        option?.id || option?.provisionalId || option?.name || "";
                                    const valueKey =
                                        value?.id || value?.provisionalId || value?.name || "";                                    
                                    
                                    return String(optionKey) === String(valueKey);
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
                                renderOption={(props, option) => {
                                    const { key, ...rest } = props;

                                    const stableKey =
                                        option?.inputValue ||
                                        (option?.isProvisional
                                            ? `prov-${option?.provisionalId || option?.id || option?.name || ""}`
                                            : `real-${option?.id || option?.name || ""}`);

                                    const secondaryText = option?.address
                                        ? [option.address, option.city].filter(Boolean).join(", ")
                                        : option?.city || "";

                                    return (
                                        <li {...rest} key={stableKey}>
                                            <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                                                <Typography variant="body1">
                                                    {option?.label || option?.name || ""}
                                                </Typography>

                                                {option?.showAddress && secondaryText ? (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ fontSize: "0.85rem" }}
                                                    >
                                                        ({secondaryText})
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                        </li>
                                    );
                                }}
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
                            This will create a provisional account for your route.
                        </Typography>
                        <TextField
                            label="Account Name"
                            value={newAccountName}
                            onChange={(event) => setNewAccountName(event.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="City"
                            value={newAccountCity}
                            onChange={(event) => setNewAccountCity(event.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeAddAccountDialog} disabled={isSavingAccount}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveProvisionalAccount}
                        disabled={isSavingAccount || !newAccountName.trim()}
                    >
                        {isSavingAccount ? "Saving..." : "Save Account"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}