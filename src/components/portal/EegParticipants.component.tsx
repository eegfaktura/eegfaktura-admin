import React, {FC} from "react";
import {EegParticipant} from "../../model/eeg.model";
import {
  DataGrid,
  GridActionsCellItem,
  GridCallbackDetails,
  GridColDef,
  GridRowParams,
  MuiEvent,

} from "@mui/x-data-grid";
import {Box, createTheme, ThemeProvider} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import EegParticipantMeterComponent from "./EegParticipantMeter.component";
import {useParticipantContext} from "./context/participant.context";
import {themeOptions} from "../../App";
import {GridRowSelectionModel} from "@mui/x-data-grid/models/gridRowSelectionModel";
import {openParticipantDialog, ParticipantCellEditDialog} from "./editor/Participant.editor";
import {Api} from "../../services/eeg.service";
import {AdminUpdateData} from "../../model/admin.model";

const EegParticipantItem: FC = () => {

  const {participants, selectParticipant, updateParticipant} = useParticipantContext()

  function extractProperties<T extends object, K extends keyof T>(
    obj: T,
    keys: Record<K, string>
  ): Record<string, T[K]> {
    const result: Record<string, T[K]> = {};
    for (const key of Object.keys(keys)) {
      if (key in obj) {
        result[keys[key as K] as string] = obj[key as K];
      }
    }
    return result;
  }

  const onUpdateParticipant = (participant: EegParticipant) => {
    // updateMeter(meter)
    const processData = {
      tenant: participant.tenant!,
      participantId: participant.id,
      value: extractProperties(participant, {"businessRole": "businessRole", "firstName": "firstname", "lastName": "lastname"})
    } as AdminUpdateData;

    Api.portalService.changeParticipantState("PARTICIPANT", processData)
      .then(row => updateParticipant(row))
  }

  const handleEditClick = (row: EegParticipant) => () => {
    openParticipantDialog(row, onUpdateParticipant)
  };

  const columns: GridColDef<EegParticipant>[] = [
    { field: 'id'},
    { field: 'firstName', headerName: 'First name', flex: 2 },
    { field: 'lastName', headerName: 'Last name', flex: 2 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
    },
    {
      field: 'businessRole',
      headerName: 'Business Role',
      description: 'Business Role of participant',
      sortable: false,
      flex: 1.5,
      // renderCell: (params: GridRenderCellParams<EegParticipant, string>) =>
      //   <BusinessCellEditor
      //     params={params}
      //     label="Business Role" header="Update Business Role" proto="BUSINESSROLE" propertyName="businessRole"
      //     updateParticipant={onUpdateParticipant}/>
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ row }) => {
        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(row)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  const onSelectRow = (params: GridRowParams, event: MuiEvent, details: GridCallbackDetails) => {
    selectParticipant(params.row)
  }

  if (participants === undefined || participants.length === 0) {
    return <></>
  }

  const onRowSelectionChanged = (selectionModel: GridRowSelectionModel, details: GridCallbackDetails) => {
    selectParticipant(participants.find(p => selectionModel.findIndex(pp => pp === p.id) >= 0))
  }

  const theme = createTheme(themeOptions)
  return (
    <ThemeProvider theme={theme}>
    <Box sx={{ height: "50%", width: '100%', display: 'flex' }}>
      <DataGrid
        rows={participants}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
          columns: {
            columnVisibilityModel: {
              id: false,
            },
          },
        }}
        pageSizeOptions={[5]}
        rowHeight={35}
        // disableRowSelectionOnClick
        // onRowClick={onSelectRow}
        onRowSelectionModelChange={onRowSelectionChanged}
        sx={{
          boxShadow: 2,
          border: 2,
          borderColor: 'primary.main',
          '& .MuiDataGrid-cell:hover': {
            backgroundColor: '#b9bab9',
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: 'primary.light',
          },
        }}
      />
    </Box>
      <ParticipantCellEditDialog />
    </ThemeProvider>
  )
}

export const EegParticipantsComponent: FC = () => {
  return (
    // <DialogProvider>
    <>
      <EegParticipantItem />
      <EegParticipantMeterComponent />
    </>
    // </DialogProvider>
  )
}