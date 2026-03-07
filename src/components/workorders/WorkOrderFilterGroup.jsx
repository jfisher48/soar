import { Button, ButtonGroup } from "@mui/material";

const FILTER_ACTIVE = "#0091EA";
const FILTER_HOVER = "#007fd1";

export default function WorkOrderFilterGroup({ listView, onChange, fullWidth = false }) {
    const getButtonSx = (value) => ({
        fontWeight: 700,
        bgcolor: listView === value ? FILTER_ACTIVE : "transparent",
        color: listView === value ? "#fff" : "inherit",
        borderColor: "rgba(0,0,0,0.23)",
        "&:hover": {
            bgcolor: listView === value ? FILTER_HOVER : "rgba(0,0,0,0.04)",
            borderColor: "rgba(0,0,0,0.23)"
        },
        "&:focus": {
            outline: "none"
        },
        "&.Mui-focusVisible": {
            outline: "2px solid #0091ea",
            outlineOffset: "2px"
        }
    });

    return (
        <ButtonGroup
            fullWidth={fullWidth}            
        >
            <Button onClick={() => onChange("open")} sx={getButtonSx("open")}>
                OPEN
            </Button>
            <Button onClick={() => onChange("completed")} sx={getButtonSx("completed")}>
                COMPLETED
            </Button>
            <Button onClick={() => onChange("held")} sx={getButtonSx("held")}>
                HELD
            </Button>
        </ButtonGroup>
    )
}