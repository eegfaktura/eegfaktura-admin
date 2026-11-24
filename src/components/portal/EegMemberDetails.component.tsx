import React, {FC, useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {selectedEeg} from "../../redux/features/eegStateSlice";
import {Alert, Box, Button, CircularProgress, Grid} from "@mui/material";
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
  const [loadError, setLoadError] = useState<string>()
  // counts "Neu laden": loads the members of the same community again
  const [reload, setReload] = useState(0)

  const {participantsLoaded, selectParticipant} = useParticipantContext()

  useEffect(() => {
    selectParticipant(undefined);
    if (eegSelected) {
      // the members of the community chosen before must not stay, also when this load fails; the answer for a
      // community that is no longer chosen is dropped (admin 261124-mm2)
      let current = true
      participantsLoaded([])
      setLoadError(undefined)
      setLoading(true)
      setEeg(eegSelected)
      Api.eegService.getParticipants(eegSelected.tenant)
        .then(p => { if (current) participantsLoaded(p) })
        .catch(() => { if (current) setLoadError("Mitglieder konnten nicht geladen werden.") })
        .finally(() => { if (current) setLoading(false) })
      return () => { current = false }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the context functions are new on every render; listing them would refetch in a loop
  }, [eegSelected, reload])

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
            <div style={{fontSize:"12px"}}>Verteilung</div>
            <div>{eeg.allocationMode}</div>
          </div>
        </Grid>
        <Grid item xs={1}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Online</div>
            <div>{eeg.online ? "Ja" : "Nein"}</div>
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
            <div style={{fontSize:"12px"}}>Kontakt</div>
            <div>{eeg.contactPerson}</div>
          </div>
        </Grid>
        <Grid item xs={2}>
          <div className="item-box">
            <div style={{fontSize:"12px"}}>Region</div>
            <div>{areaLabel(eeg.area)}</div>
          </div>
        </Grid>
      </Grid>
      {loadError ? (
        <Alert severity="error" sx={{mt: 2}}
               action={<Button color="inherit" size="small" onClick={() => setReload(n => n + 1)}>Neu laden</Button>}>
          {loadError}
        </Alert>
      ) : (
        <Box>
          <SearchBarComponent />
          <EegParticipantsComponent />
        </Box>
      )}
    </Box>
  )
}

export default EegMemberDetailsComponent