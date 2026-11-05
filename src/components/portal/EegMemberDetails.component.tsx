import React, {FC, useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {selectedEeg} from "../../redux/features/eegStateSlice";
import {Box, CircularProgress, Grid} from "@mui/material";
import {Api} from "../../services/eeg.service";
import {EegMember} from "../../model/eeg.model";
import {EegParticipantsComponent} from "./EegParticipants.component";

import "./EegMemberDetails.component.scss"
import {useParticipantContext} from "./context/participant.context";
import {SearchBarComponent} from "./AppBar.component";
import {areaLabel} from "../../model/area";
import {settlementLabel} from "../../model/settlement";

const EegMemberDetailsComponent: FC = () => {

  const eegSelected = useSelector(selectedEeg)
  const [loading, setLoading] = useState<boolean>(false)
  const [eeg, setEeg] = useState<EegMember>()

  const {participantsLoaded, selectParticipant} = useParticipantContext()

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
            <div style={{fontSize:"12px"}}>Abrechnungszeitraum</div>
            <div>{settlementLabel(eeg.settlementInterval)}</div>
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
            <div>{areaLabel(eeg.area)}</div>
          </div>
        </Grid>
      </Grid>
      <Box>
        <SearchBarComponent />
        <EegParticipantsComponent />
      </Box>
    </Box>
  )
}

export default EegMemberDetailsComponent