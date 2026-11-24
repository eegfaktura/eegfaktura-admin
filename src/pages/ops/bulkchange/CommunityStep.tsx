import React, {FC, useCallback, useEffect, useState} from "react";
import {Alert, Autocomplete, Button, CircularProgress, Stack, TextField} from "@mui/material";
import {BulkChangeService, BulkCommunity} from "../../../services/bulkchange.service";
import {describeError} from "./texts";

// Step 1: one community. Name, tenant and RC number are shown separately: a GEA tenant (GCxxxxxx-00n) differs
// from its RC number, and the run is chosen by the tenant.
const CommunityStep: FC<{
  service: BulkChangeService,
  value: BulkCommunity | null,
  onChange: (c: BulkCommunity | null) => void,
}> = ({service, value, onChange}) => {
  const [list, setList] = useState<BulkCommunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setList(null);
    service.communities()
      .then(l => setList([...l].sort((a, b) => a.name.localeCompare(b.name, "de"))))
      .catch(e => setError(describeError(e, "communities").text));
  }, [service]);

  useEffect(load, [load]);

  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Neu laden</Button>}>
        Gemeinschaften konnten nicht geladen werden: {error}
      </Alert>
    );
  }
  if (list === null) {
    return <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20}/><span>Gemeinschaften werden geladen …</span></Stack>;
  }
  if (list.length === 0) {
    return <Alert severity="info">Keine Gemeinschaften gefunden.</Alert>;
  }
  return (
    <Autocomplete
      options={list}
      value={value}
      onChange={(_, c) => onChange(c)}
      isOptionEqualToValue={(a, b) => a.tenant === b.tenant}
      getOptionLabel={c => `${c.name} · Tenant ${c.tenant} · ${c.rcNumber}`}
      renderInput={params => <TextField {...params} label="Gemeinschaft (Name, Tenant oder RC-Nummer)"/>}
    />
  );
};

export default CommunityStep;
