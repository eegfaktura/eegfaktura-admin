import React, {FC, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {selectedEeg, updateEegByTenant} from "../../redux/features/eegStateSlice";
import {
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup
} from "@mui/material";
import {Api} from "../../services/eeg.service";
import {EegMember} from "../../model/eeg.model";
import {EegParticipantsComponent} from "./EegParticipants.component";

import "./EegMemberDetails.component.scss"
import {useParticipantContext} from "./context/participant.context";
import {SearchBarComponent} from "./AppBar.component";
import EditIcon from "@mui/icons-material/Edit";
import {Control, Controller, useForm} from "react-hook-form";
import {EditDialogProvider, openDialog} from "../common/EditDialog.provider";
import {AdminUpdateData} from "../../model/admin.model";

const SettlementElement: FC<{control: Control<Record<string, any>>}> = ({control}) => {

  return (
        <div>
          <FormControl>
            <Controller
              rules={{ required: true }}
              control={control}
              name="settlementInterval"
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby="demo-radio-buttons-group-label"
                  {...field}
                >
                  <FormControlLabel value="ANNUAL" control={<Radio />} label="Jährlich" />
                  <FormControlLabel value="BIANNUAL" control={<Radio />} label="Halbjährlich" />
                  <FormControlLabel value="QUARTER" control={<Radio />} label="Quartal" />
                  <FormControlLabel value="MONTHLY" control={<Radio />} label="Monatlich" />
                </RadioGroup>)} />

          </FormControl>
        </div>
  )
}

const EegMemberDetailsComponent: FC = () => {

  const eegSelected = useSelector(selectedEeg)
  const [loading, setLoading] = useState<boolean>(false)
  const [eeg, setEeg] = useState<EegMember>()
  // const [participants, setParticipants] = useState<EegParticipant[]>([])

  const {participantsLoaded, selectParticipant} = useParticipantContext()
  const dispatch = useDispatch()

  useEffect(() => {
    selectParticipant(undefined);
    if (eegSelected) {
      setLoading(true)
      setEeg(eegSelected)
      Api.eegService.getParticipants(eegSelected.tenant).then(p => {
        participantsLoaded(p)
      }).finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the context functions are new on every render; listing them would refetch in a loop
  }, [eegSelected])

  const {handleSubmit, control, setValue, reset} = useForm<Record<string, any>>()

  const updateEeg = (data: Record<string, any>) => {
    const eegData = {
      tenant: eeg?.tenant,
      value: data,
    } as AdminUpdateData;

    // returned so the dialog waits for it and shows a failure
    return Api.portalService.changeEegState("EEG", eegData)
      // .then(d => {
      // setSettlementInterval(d.settlementInterval)
      // return d})
      .then(d => {
        dispatch(updateEegByTenant(d))
        setEeg(s => s ? {...s, ...eegData.value} : undefined)
      })
  }

  const onSettlementChanged = (values: Record<string, any>) => {

    reset({})
    for (const key of Object.keys(values)) {
      if (key in values) {
        setValue(key, values[key])
      }
    }
    openDialog(<SettlementElement control={control}/>, "Verrechnung", handleSubmit(updateEeg))
  }

  if (!eeg) {
    return (
      <></>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: "100%" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{margin: "16px", display: "flex", flexDirection: 'column'}}>
      <Grid container className="item-header">
        <Grid item xs={3}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Name</div>
            <div>{eeg.description}</div>
          </div>
        </Grid>
        <Grid item xs={2}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Mode</div>
            <div>{eeg.allocationMode}</div>
          </div>
        </Grid>
        <Grid item xs={1}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Online</div>
            <div>{eeg.online ? "Yes" : "No"}</div>
          </div>
        </Grid>
        <Grid item xs={2}>
          <div className="item-box">
            <div style={{position: "relative"}}>
              <div style={{fontSize:"12px"}}>Settlement</div>
              <div>{eeg.settlementInterval}</div>
              <div style={{position: "absolute", top: "0", right: "0"}}>
                <IconButton onClick={(_) => onSettlementChanged({"settlementInterval": eeg.settlementInterval})}>
                  <EditIcon />
                </IconButton>
              </div>
            </div>
          </div>
        </Grid>
        <Grid item xs={2}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Contact</div>
            <div>{eeg.contactPerson}</div>
          </div>
        </Grid>
        <Grid item xs={2}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Area</div>
            <div>{eeg.area}</div>
          </div>
        </Grid>
      </Grid>
      <Box>
        <SearchBarComponent />
        <EegParticipantsComponent />
      </Box>
      <EditDialogProvider/>
    </Box>
  )
}

export default EegMemberDetailsComponent