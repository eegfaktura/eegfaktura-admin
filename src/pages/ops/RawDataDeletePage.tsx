import React, {FC, useState} from "react";
import {Alert, Box, Button, Divider, Stack, TextField, Typography} from "@mui/material";
import {DateTimePicker} from "@mui/x-date-pickers";
import moment, {Moment} from "moment";
import {Api} from "../../services/eeg.service";
import {RawDataDeleteResult} from "../../services/portal.service";

// Minimal ops tool: zero the raw energy data of one metering point within a time
// range in energystore v1. Two steps: dry-run preview → double-confirm (retype the
// metering point) → irreversible execute. Cross-tenant use requires the superuser
// role; the backend enforces it.
const RawDataDeletePage: FC = () => {
  const [tenant, setTenant] = useState("");
  const [ecId, setEcId] = useState("");
  const [meteringPoint, setMeteringPoint] = useState("");
  const [from, setFrom] = useState<Moment | null>(null);
  const [to, setTo] = useState<Moment | null>(null);

  const [preview, setPreview] = useState<RawDataDeleteResult | null>(null);
  const [confirmMp, setConfirmMp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<RawDataDeleteResult | null>(null);

  const inputsValid = tenant.trim() !== "" && ecId.trim() !== "" && meteringPoint.trim() !== ""
    && from !== null && to !== null && from.isBefore(to);

  // Any change to the inputs invalidates a previous preview/confirmation.
  const resetFlow = () => {
    setPreview(null);
    setConfirmMp("");
    setDone(null);
    setError(null);
  };

  const baseProps = () => ({
    tenant: tenant.trim(),
    ecId: ecId.trim(),
    meteringPoint: meteringPoint.trim(),
    start: from!.valueOf(),
    end: to!.valueOf(),
  });

  const runPreview = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await Api.portalService.deleteRawData({...baseProps(), dryRun: true});
      setPreview(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await Api.portalService.deleteRawData({...baseProps(), dryRun: false});
      setDone(res);
      setPreview(null);
      setConfirmMp("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{maxWidth: 640, p: 3}}>
      <Typography variant="h5" gutterBottom>Energiedaten löschen</Typography>

      <Alert severity="warning" sx={{mb: 2}}>
        Löscht die Energiedaten <strong>eines Zählpunkts</strong> im gewählten Zeitraum
        (energystore&nbsp;v1). Die Werte werden auf 0 gesetzt — <strong>endgültig, kein
        Undo</strong>. Zuerst Vorschau, dann zur Bestätigung den Zählpunkt erneut eingeben.
      </Alert>

      <Stack spacing={2}>
        <TextField label="Tenant (z. B. RC100000)" value={tenant}
                   onChange={(e) => {setTenant(e.target.value); resetFlow();}} fullWidth/>
        <TextField label="Gemeinschafts-ID" value={ecId}
                   helperText="Lange AT…-Nummer aus den EEG-Eigenschaften (nicht die EC-Nummer)"
                   onChange={(e) => {setEcId(e.target.value); resetFlow();}} fullWidth/>
        <TextField label="Zählpunkt" value={meteringPoint}
                   onChange={(e) => {setMeteringPoint(e.target.value); resetFlow();}} fullWidth/>
        <DateTimePicker label="Von" value={from} ampm={false}
                        onChange={(v) => {setFrom(v); resetFlow();}}/>
        <DateTimePicker label="Bis" value={to} ampm={false}
                        onChange={(v) => {setTo(v); resetFlow();}}/>

        <Button variant="outlined" onClick={runPreview} disabled={!inputsValid || busy}>
          Vorschau (Dry-Run)
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {preview && (
          <>
            <Divider/>
            <Alert severity="info">
              Betroffen: <strong>{preview.affectedTimesteps}</strong> Zeitschritte
              (Σ {preview.sumKwh.toFixed(2)} kWh) für Zählpunkt {preview.meteringPoint}.
              {preview.affectedTimesteps === 0 && " — nichts zu löschen."}
            </Alert>
            {preview.affectedTimesteps > 0 && (
              <>
                <TextField label="Zählpunkt zur Bestätigung erneut eingeben"
                           value={confirmMp} onChange={(e) => setConfirmMp(e.target.value)} fullWidth/>
                <Button variant="contained" color="error" onClick={runDelete}
                        disabled={busy || confirmMp.trim() !== meteringPoint.trim()}>
                  Endgültig löschen
                </Button>
              </>
            )}
          </>
        )}

        {done && (
          <Alert severity="success">
            Gelöscht: {done.affectedTimesteps} Zeitschritte für Zählpunkt {done.meteringPoint}.
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default RawDataDeletePage;
