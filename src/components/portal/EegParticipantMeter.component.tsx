import {FC, ReactNode, useState} from "react";
import {EegParticipant, Metering} from "../../model/eeg.model";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl, FormControlLabel,
  IconButton,
  Radio,
  RadioGroup
} from "@mui/material";
import { ModeEditRounded } from '@mui/icons-material';

import {DataGrid, GridColDef, GridRenderCellParams, useGridApiRef} from "@mui/x-data-grid";
import {DatePicker} from "@mui/x-date-pickers";
import moment from 'moment'
import {Controller, FormState, useForm} from "react-hook-form";
import {Api} from "../../services/eeg.service";
import {AdminUpdateData} from "../../model/admin.model";
import {UseFormReset} from "react-hook-form/dist/types/form";
import {CellEditDialog, editDialog} from "./CellEdit.dialog";
import {GridRowModel} from "@mui/x-data-grid/models/gridRows";
import {useParticipantContext} from "./context/participant.context";
import {DateCellEditor} from "./editor/DateCell.editor";

const CellEditInputDialog:FC<{open: boolean, handleClose: () => void, handleSubmit: () => void, formState: FormState<Metering>, children: ReactNode}> = ({open, handleClose,handleSubmit, formState, children}) => <Dialog
  open={open}
  onClose={handleClose}
>
  <form onSubmit={(event) => {
    event.preventDefault();
    event.persist();
    handleSubmit();
  }}
  >
  <DialogTitle>Subscribe</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Update
    </DialogContentText>
    {children}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button type="submit" disabled={!(formState.isValid && formState.isDirty)}>Subscribe</Button>
  </DialogActions>
  </form>
</Dialog>

const CellEditInputElement:FC<{params: GridRenderCellParams<any, string>, onUpdate: () => void, reset: UseFormReset<Metering>, formState: FormState<Metering>, children: ReactNode}> = ({params, onUpdate, reset, formState, children}) => {

  const [openDialog, setOpenDialog] = useState(false);

  const handleSubmit = () => {
    setOpenDialog(false);
    onUpdate();
  }

  const onClose = () => {
    setOpenDialog(false)
    reset()
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ width: "100%"}}>{params.value}</div>
        <IconButton color="primary" sx={{ fontSize: "6px" }} aria-label="directions" onClick={() => setOpenDialog(true)}>
          <ModeEditRounded sx={{fontSize: "18px"}}/>
        </IconButton>
      </Box>
      <CellEditInputDialog open={openDialog} handleClose={onClose} handleSubmit={handleSubmit} formState={formState}>{children}</CellEditInputDialog>
    </>
  );
}

const CellEditInputElement1:FC<{params: GridRenderCellParams<Metering, string>, onStartEdit: (row: GridRowModel<Metering>) => void}> = ({params, onStartEdit}) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ width: "100%"}}>{params.value}</div>
        <IconButton color="primary" sx={{ fontSize: "6px" }} aria-label="directions" onClick={() => onStartEdit(params.row)}>
          <ModeEditRounded sx={{fontSize: "18px"}}/>
        </IconButton>
      </Box>
    </>
  );
}

const ProcessStateEditor: FC<{params: GridRenderCellParams<Metering, string>, updateMeter: (meter: Metering) => void}> = ({params, updateMeter}) => {

  // const [value, setValue] = useState(params.value);
  // const [activeDate, setActiveDate] = useState(params.row.activeSince)
  // const [inactiveDate, setInactiveDate] = useState(params.row.inactiveSince)

  const onUpdate = (meter: Metering) => {

    let processData = {
      tenant: params.row.tenant!,
      participantId: params.row.participantId,
      meteringPoint: params.row.meteringPoint,
      value: {processState: meter.processState}} as AdminUpdateData;

    if (meter.processState === 'ACTIVE') {
      processData.value["activeSince"] = (moment(meter.activeSince).unix()*1000).toString()
    }

    if (meter.processState === 'INACTIVE') {
      processData.value["inactiveSince"] = (moment(meter.inactiveSince).unix()*1000).toString()
    }

    Api.portalService.changeProcessState("PROCESSSTATUS", processData)
      .then(row => {
        updateMeter(row)
      })
      .catch(e => reset());
    // params.api.getSelectedRows().set(params.row.meteringPoint, params.row);
  }
  const { handleSubmit, control, reset } = useForm<Metering>({
    defaultValues: {
      ...params.row
    },
  });

  return (
    // <CellEditInputElement1 params={params} onUpdate={onUpdate} reset={reset} formState={formState}>
    <CellEditInputElement1 params={params} onStartEdit={(row) => {
      editDialog (
      <div>
        <FormControl>
          <Controller
            rules={{ required: true }}
            control={control}
            name="processState"
            render={({ field }) => (
          <RadioGroup
            aria-labelledby="demo-radio-buttons-group-label"
            {...field}
          >
            <FormControlLabel value="ACTIVE" control={<Radio />} label="ACTIVE" />
            {field.value === 'ACTIVE' && <Controller
              rules={{ required: true }}
              control={control}
              name="activeSince"
              render={({ field }) => (<DatePicker
                label="Active seit ..."
                format="DD.MM.YYYY"
                value={field.value ? moment(field.value) : null}
                onChange={(newValue) => { if (newValue) field.onChange(newValue.toDate()) }}
                slotProps={{textField: {id: "date", size: "small", required: true, sx: {width: 220}}}}
                />)}
            />}
            <FormControlLabel value="INACTIVE" control={<Radio />} label="Zählpunkt INACTIVE" />
            {field.value === 'INACTIVE' && <Controller
                rules={{ required: true }}
                control={control}
                name="inactiveSince"
                render={({ field }) => (<DatePicker
                  label="Inactive seit ..."
                  format="DD.MM.YYYY"
                  value={field.value ? moment(field.value) : null}
                  onChange={(newValue) => { if (newValue) field.onChange(newValue.toDate()) }}
                  slotProps={{textField: {id: "date", size: "small", required: true, sx: {width: 220}}}}
                />)}
            />}
            <FormControlLabel value="INIT" control={<Radio />} label="Registrierung noch nicht gestartet" />
            <FormControlLabel value="PENDING" control={<Radio />} label="Warte auf Zustimmung" />
            <FormControlLabel value="APPROVED" control={<Radio />} label={"Warte auf Abschluss"} />
          </RadioGroup>)} />

        </FormControl>
      </div>, "Update Prozess Status", handleSubmit(onUpdate))
    }} />
  )
}

const EegParticipantMeterComponent: FC = () => {

  // const [meters, setMeters] = useState<Metering[]>()
  const apiRef = useGridApiRef()

  const {selectedMeters, updateMeter, selectedParticipant} = useParticipantContext()

  // useEffect(() => {
  //   participant && setMeters(participant.meters)
  // }, [participant]);

  const onUpdateMeter = (meter: Metering) => {
    // setMeters(meters?.map(x => x.meteringPoint === meter.meteringPoint ? meter : x))
    updateMeter(meter)
    // apiRef.current?.updateRows([{id: meter.meteringPoint, processState: meter.processState}])
  }

  const columns: GridColDef<Metering>[] = [
    { field: 'meteringPoint', headerName: 'Meter-Id', flex: 1.5},
    { field: 'direction', headerName: 'Richtung', flex: 0.7 },
    { field: 'status', headerName: 'Zustand', flex: 0.7 },
    {
      field: 'processState',
      headerName: 'Prozess Status',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      flex: 1,
      renderCell: (params: GridRenderCellParams<any, string>) => <ProcessStateEditor params={params} updateMeter={onUpdateMeter}/>
    },
    { field: 'activeSince', headerName: 'Aktiv', flex: 0.5,
      renderCell: (params:GridRenderCellParams<Metering, string>) =>
        <DateCellEditor params={params} label="Active seit ..." header="Update ACTIVESINCE" proto="ACTIVESINCE" propertyName="activeSince" updateMeter={onUpdateMeter} />,
      valueFormatter: params =>
        moment(params?.value).format("DD/MM/YYYY")
    },
    { field: 'inactiveSince', headerName: 'Inaktiv', flex: 0.5,
      renderCell: (params:GridRenderCellParams<Metering, string>) =>
        <DateCellEditor params={params} label="Inactive seit ..." header="Update INACTIVESINCE" proto="INACTIVESINCE" propertyName="inactiveSince" updateMeter={onUpdateMeter} />,
      valueFormatter: params =>
        moment(params?.value).format("DD/MM/YYYY")
    },
  ];

  if (selectedMeters === undefined || selectedMeters.length === 0) {
    return <></>
  }

  return (
    <Box marginY={2}>
      <div>{selectedParticipant?.firstName} {selectedParticipant?.lastName}</div>
      <Box sx={{ height: '50%', width: '100%', display: 'flex' }}>
        <DataGrid
          apiRef={apiRef}
          rows={selectedMeters}
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
          // disableRowSelectionOnClick
          rowHeight={35}
          getRowId={(row) => row.meteringPoint}
        />
        <CellEditDialog />
      </Box>
    </Box>
  )
}

export default EegParticipantMeterComponent;