import React, {FC, useState} from "react";
import {Alert, Box, Button, Checkbox, Divider, FormControlLabel, Stack, Typography} from "@mui/material";
import {Api} from "../../../services/eeg.service";
import {applyItems, BulkApplyResult, BulkChangeService, BulkCommunity, BulkPreview, BulkRow, BulkRule} from "../../../services/bulkchange.service";
import CommunityStep from "./CommunityStep";
import RuleFormStep from "./RuleFormStep";
import PreviewTable, {Filter} from "./PreviewTable";
import ApplyResult from "./ApplyResult";
import {buildRule, formProblems, initialForm, RuleForm, todayIso} from "./rule";
import {describeError, ErrorView} from "./texts";
import {csvFileName, downloadCsv, previewCsv} from "./csv";

// Bulk change of master data for the VFEEG support (konzept-massenaenderungen.md): one community, one rule,
// mandatory preview, apply only after "Vorschau geprüft". Any change of community or rule drops the preview.
// No undo (decision 4): a wrong run is corrected with a new one.

interface PreviewState {
  tenant: string;
  rule: BulkRule;
  data: BulkPreview;
}

const BulkChangePage: FC<{ service?: BulkChangeService }> = ({service = Api.bulkChangeService}) => {
  const [community, setCommunity] = useState<BulkCommunity | null>(null);
  const [form, setForm] = useState<RuleForm>(initialForm());
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorView | null>(null);
  const [result, setResult] = useState<{ rule: BulkRule, data: BulkApplyResult, previewRows: BulkRow[] } | null>(null);

  const resetFlow = () => {
    setPreview(null);
    setChecked(false);
    setError(null);
    setResult(null);
  };

  const ruleReady = community !== null && Object.keys(formProblems(form)).length === 0;
  const changedCount = preview?.data.counts.changed ?? 0;

  const runPreview = async () => {
    if (!community) return;
    const rule = buildRule(form);
    setBusy(true);
    resetFlow();
    try {
      const data = await service.preview(community.tenant, rule);
      setPreview({tenant: community.tenant, rule, data});
    } catch (e) {
      setError(describeError(e, "preview"));
    } finally {
      setBusy(false);
    }
  };

  const runApply = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const data = await service.apply(preview.tenant, preview.rule, applyItems(preview.data));
      setResult({rule: preview.rule, data, previewRows: preview.data.rows});
      setPreview(null);
      setChecked(false);
    } catch (e) {
      const view = describeError(e, "apply");
      setError(view);
      if (view.reloadPreview) {
        // the preview no longer describes the data: it must not be applied again
        setPreview(null);
        setChecked(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const download = (rows: BulkRow[], filter: Filter) => {
    if (!preview) return;
    downloadCsv(csvFileName(preview.tenant, preview.rule.field, filter, todayIso()), previewCsv(preview.rule.field, rows));
  };

  return (
    <Box sx={{p: 3, maxWidth: 1400}}>
      <Typography variant="h5" gutterBottom>Massenänderung Stammdaten</Typography>
      <Alert severity="warning" sx={{mb: 3}}>
        Immer genau eine Gemeinschaft · Vorschau ist Pflicht · <strong>keine Rücknahme</strong>: Alte Werte werden
        nicht gespeichert; eine falsche Änderung wird mit einer neuen Massenänderung korrigiert (die heruntergeladene
        Vorschau hält den früheren Stand fest). Keine Meldung an den Netzbetreiber, keine Mail an Mitglieder. Dass
        unterschriebene Einzugsermächtigungen vorliegen, bestätigt die Gemeinschaft.
      </Alert>

      <Stack spacing={3}>
        <section>
          <Typography variant="h6" gutterBottom>1 Gemeinschaft</Typography>
          <CommunityStep service={service} value={community} onChange={c => {setCommunity(c); resetFlow();}}/>
        </section>

        <section>
          <Typography variant="h6" gutterBottom>2 Regel</Typography>
          <RuleFormStep form={form} onChange={f => {setForm(f); resetFlow();}}/>
          <Button variant="outlined" sx={{mt: 2}} onClick={runPreview} disabled={!ruleReady || busy}>
            Vorschau berechnen
          </Button>
        </section>

        {error && (
          <Alert severity="error" action={error.reloadPreview && (
            <Button color="inherit" size="small" onClick={runPreview} disabled={busy || !ruleReady}>
              Vorschau neu berechnen
            </Button>
          )}>
            {error.text}
          </Alert>
        )}

        {preview && (
          <section>
            <Divider sx={{mb: 2}}/>
            <Typography variant="h6" gutterBottom>3 Vorschau</Typography>
            <PreviewTable field={preview.rule.field} preview={preview.data} onDownload={download}/>
            <Typography variant="h6" sx={{mt: 3}} gutterBottom>4 Anwenden</Typography>
            {changedCount === 0
              ? <Alert severity="info">Nichts zu ändern.</Alert>
              : (
                <Stack direction={{xs: "column", md: "row"}} spacing={2} alignItems={{md: "center"}}>
                  <FormControlLabel label="Vorschau geprüft" control={
                    <Checkbox checked={checked} onChange={e => setChecked(e.target.checked)}/>}/>
                  <Button variant="contained" color="warning" onClick={runApply} disabled={!checked || busy}>
                    {changedCount === 1 ? "1 Änderung anwenden" : `${changedCount} Änderungen anwenden`}
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Geschrieben werden nur die geänderten Treffer, deren Werte noch der Vorschau entsprechen;
                    alles in einem Schritt oder gar nichts.
                  </Typography>
                </Stack>
              )}
          </section>
        )}

        {result && (
          <section>
            <Divider sx={{mb: 2}}/>
            <Typography variant="h6" gutterBottom>Ergebnis</Typography>
            <ApplyResult field={result.rule.field} result={result.data} previewRows={result.previewRows}/>
          </section>
        )}
      </Stack>
    </Box>
  );
};

export default BulkChangePage;
