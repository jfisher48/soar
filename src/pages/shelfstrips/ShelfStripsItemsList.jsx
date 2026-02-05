import { Box, Typography, Grid } from "@mui/material";

export default function ShelfStripsItemsList({items, money}) {
    return (
        <Box sx={{ ml: -0.5 }}>
            {items.map((it) => (
                <Grid container key={it.id ?? `${it.brand}-${it.pkg}-${it.price}`} columnSpacing={1} sx={{ py: 1, borderBottom: "1px dotted rgba(0,0,0,0.25)", alignItems: "center" }}>
                    <Grid size={{ xs: 2, sm: 1.5 }} sx={{ display: "flex", justifyContent: "center"}}>
                        <Typography variant="h5" sx={{ fontWeight: 400, lineHeight: 1}}>
                            {it.quantity ?? "-"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 10, sm: 10.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5}}>
                            {it.brand || "-"}
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(0,0,0,0.75)", lineHeight: 1.5 }}>
                            {[it?.extText, money(it.price), it.pkg].filter(Boolean).join(" ")}
                        </Typography>
                        {!!it.singlePrice && (
                            <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.55)", display: "block", mt: 0.25 }}>
                                {it.singlePrice}
                            </Typography>
                        )}
                    </Grid>                                         
                </Grid>
            ))}            
        </Box>
    );
}