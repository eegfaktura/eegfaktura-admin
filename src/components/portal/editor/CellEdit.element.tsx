import {FC} from "react";
import {GridRenderCellParams} from "@mui/x-data-grid";
import {EegParticipant, Metering} from "../../../model/eeg.model";
import {GridRowModel} from "@mui/x-data-grid/models/gridRows";
import {Box, IconButton} from "@mui/material";
import {ModeEditRounded} from "@mui/icons-material";
import moment from "moment";

export const CellEditElement:FC<{params: GridRenderCellParams<EegParticipant | Metering, any>, onStartEdit: (row: GridRowModel<EegParticipant | Metering>) => void}> = ({params, onStartEdit}) => {

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ width: "100%"}}>{params.formattedValue}</div>
        <IconButton color="primary" sx={{ fontSize: "6px" }} aria-label="directions" onClick={() => onStartEdit(params.row)}>
          <ModeEditRounded sx={{fontSize: "18px"}}/>
        </IconButton>
      </Box>
    </>
  );
}