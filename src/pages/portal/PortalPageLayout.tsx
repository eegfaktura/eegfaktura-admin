import React, {useEffect, useMemo, useState} from "react";
import {Alert, Box, Card, CardActionArea, CardContent, CircularProgress, Grid} from "@mui/material";
import {Api} from "../../services/eeg.service";
import {EegMember} from "../../model/eeg.model";
import EegMemberDetailsComponent from "../../components/portal/EegMemberDetails.component";
import {useDispatch, useSelector} from "react-redux";
import {allEegs, selectedEeg, setEegAll, setSelectedEeg} from "../../redux/features/eegStateSlice"
import {ParticipantProvider} from "../../components/portal/context/participant.context";

import "./PortalPage.layout.scss"
import classNames from "classnames";
import {SearchInputComponent} from "../../components/portal/components/SearchInput.component";

const PortalPageLayout = () => {

  // const [members, setMembers] = useState<EegMember[]>()
  const dispatch = useDispatch()

  const members = useSelector(allEegs)
  const eegSelected = useSelector(selectedEeg)
  const [filterString, setFilterString] = useState<string | undefined>()
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "failed">("loading")

  useEffect(() => {
    Api.eegService.getEeg()
      .then(eegs => {
        dispatch(setEegAll(eegs))
        setLoadState("loaded")
      })
      .catch(() => setLoadState("failed"))
  }, [dispatch]);

  const filteredMembers = useMemo(() => {
    if (filterString) {
      return members.filter(m => m.tenant.toLowerCase().indexOf(filterString.toLowerCase()) > -1 || m.name.toLowerCase().indexOf(filterString.toLowerCase()) > -1)
    }
    return members
  }, [filterString, members])

  const card = (m: EegMember) => (
    <React.Fragment>
      <CardContent sx={{pb: 1, '&:last-child': { pb: 1 }}} className={classNames("eeg-card", {"selected": m.tenant === eegSelected?.tenant})}>
        <div className={classNames("eeg-card-content", {"selected": m.tenant === eegSelected?.tenant})}>
          <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%"}}>
            <div>{m.tenant}</div>
          </div>
          <div style={{fontSize: "12px"}}>{m.name}</div>
        </div>
      </CardContent>
    </React.Fragment>
  );

  // a list loaded before stays visible while it is loaded again
  if (members.length === 0) {
    switch (loadState) {
      case "loading":
        return <Box sx={{display: "flex", justifyContent: "center", p: 3}}><CircularProgress aria-label="Gemeinschaften werden geladen"/></Box>
      case "failed":
        return <Box sx={{p: 3}}><Alert severity="error">Gemeinschaften konnten nicht geladen werden.</Alert></Box>
      default:
        return <Box sx={{p: 3}}><Alert severity="info">Keine Gemeinschaften</Alert></Box>
    }
  }

  return (
    <Box height="100%" flex={1}>
      <Grid container height="100%" flexDirection={"row"}>
        <Grid item xs={3} height="100%">
          <Box display="flex" flexDirection="column" height="100%" sx={{p: 2}}>
            <SearchInputComponent setSearchItem={setFilterString}></SearchInputComponent>
            <div style={{padding: "5px", fontWeight: "bold"}}>Gemeinschaften</div>
            <div style={{overflow: "auto", flex: "1"}}>
              <Box style={{display: "flex", flexDirection: "column", rowGap: "10px", width: "100%", padding: "12px"}}
                   overflow="auto">
                {filteredMembers && filteredMembers.sort((a:EegMember, b:EegMember) => a.tenant > b.tenant ? 1 : -1).map((m, i) => {
                  return (
                    <Card variant="outlined" key={i}>
                      <CardActionArea onClick={() => dispatch(setSelectedEeg(m))}
                                      aria-current={m.tenant === eegSelected?.tenant ? "true" : undefined}>
                        {card(m)}
                      </CardActionArea>
                    </Card>
                  )
                })}
              </Box>
            </div>
          </Box>
        </Grid>
        <Grid item xs={9} width="100%" height="100%" overflow="auto">
          <ParticipantProvider>
            <EegMemberDetailsComponent />
          </ParticipantProvider>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortalPageLayout;