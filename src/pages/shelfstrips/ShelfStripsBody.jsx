import { Typography } from "@mui/material";
import ShelfStripsItemsList from "./ShelfStripsItemsList";

export default function ShelfStripsBody({ wo, money }) {
    const items = Array.isArray(wo?.items) ? wo.items : [];

    return(
        <>
            <Typography>
                Items
            </Typography>
            <ShelfStripsItemsList items={items} money={money} />
        </>
    );
}