import { Typography } from "@mui/material";
import ShelfStripsItemsList from "./ShelfStripsItemsList";

export default function ShelfStripsBody({ wo, money }) {
    const items = Array.isArray(wo?.items) ? wo.items : [];

    return(
        <>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Items
            </Typography>
            <ShelfStripsItemsList items={items} money={money} />
            {items.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5}}>
                    No Items on this workorder.
                </Typography>
            )}
        </>
    );
}