import React, {FC, useEffect, useState} from "react";
import {Alert, Box, Button, Divider, Stack, Typography} from "@mui/material";
import {Api} from "../../../services/eeg.service";
import {applyItems, BulkApplyResult, BulkChangeService, BulkCommunity, BulkPreview, BulkRow, BulkRule, BulkTariff} from "../../../services/bulkchange.service";
import CommunityStep from "./CommunityStep";
import RuleFormStep from "./RuleFormStep";
import PreviewTable, {Filter} from "./PreviewTable";
import ApplyResult from "./ApplyResult";
import ApplyStep from "./ApplyStep";
import {buildRule, formProblems, initialForm, RuleForm, todayIso, valueKind} from "./rule";
import {BulkOperation, describeError, ErrorView} from "./texts";
import {csvFileName, downloadCsv, previewCsv} from "./csv";

// Bulk change of master data for the VFEEG support (konzept-massenaenderungen.md): one community, one rule,
// mandatory preview, apply only after "Vorschau geprüft". Any change of community or rule drops the preview.
// No undo (decision 4): a wrong run is corrected with a new one.

interface PreviewState {
  community: BulkCommunity;
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
  const [error, setError] = useState<{ view: ErrorView, op: BulkOperation } | null>(null);
  const [result, setResult] = useState<{ tenant: string, rule: BulkRule, data: BulkApplyResult, previewRows: BulkRow[] } | null>(null);
  const [tariffs, setTariffs] = useState<BulkTariff[] | null>(null);
  const [tariffError, setTariffError] = useState<string | null>(null);

  // the tariffs of the chosen community, for the tariff rules
  const tenant = community?.tenant;
  useEffect(() => {
    setTariffs(null);
    setTariffError(null);
    if (!tenant) return;
    let current = true;
    service.tariffs(tenant)
      .then(l => current && setTariffs(l))
      .catch(e => current && setTariffError(describeError(e, "communities").text));
    return () => {
      current = false;
    };
  }, [service, tenant]);

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
      setPreview({community, tenant: community.tenant, rule, data});
    } catch (e) {
      setError({view: describeError(e, "preview"), op: "preview"});
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
      setResult({tenant: preview.tenant, rule: preview.rule, data, previewRows: preview.data.rows});
      setPreview(null);
      setChecked(false);
    } catch (e) {
      const view = describeError(e, "apply");
      setError({view, op: "apply"});
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
      <Typography variant="h5" component="h1" gutterBottom>Massenänderung</Typography>
      <Alert severity="warning" sx={{mb: 3}}>
        Immer genau eine Gemeinschaft · Vorschau ist Pflicht · <strong>keine Rücknahme</strong>
      </Alert>

      <Stack spacing={3}>
        <section>
          <Typography variant="h6" component="h2" gutterBottom>1 Gemeinschaft</Typography>
          <CommunityStep service={service} value={community} onChange={c => {
            setCommunity(c);
            // a tariff of the previous community does not belong to the new one
            if (valueKind(form.field) === "tariff") setForm({...form, value: "", conditionValue: ""});
            resetFlow();
          }}/>
        </section>

        <section>
          <Typography variant="h6" component="h2" gutterBottom>2 Regel</Typography>
          {tariffError && valueKind(form.field) === "tariff" && (
            <Alert severity="error" sx={{mb: 2}}>Tarife der Gemeinschaft konnten nicht geladen werden: {tariffError}</Alert>
          )}
          <RuleFormStep form={form} tariffs={tariffs} onChange={f => {setForm(f); resetFlow();}}/>
          <Button variant="outlined" sx={{mt: 2}} onClick={runPreview} disabled={!ruleReady || busy}>
            Vorschau berechnen
          </Button>
        </section>

        {error && !(error.op === "apply" && preview) && (
          <Alert severity="error" action={error.view.reloadPreview && (
            <Button color="inherit" size="small" onClick={runPreview} disabled={busy || !ruleReady}>
              Vorschau neu berechnen
            </Button>
          )}>
            {error.view.text}
          </Alert>
        )}

        {preview && (
          <section>
            <Divider sx={{mb: 2}}/>
            <Typography variant="h6" component="h2" gutterBottom>3 Vorschau</Typography>
            <PreviewTable field={preview.rule.field} preview={preview.data} onDownload={download}/>
            <Typography variant="h6" component="h2" sx={{mt: 3}} gutterBottom>4 Anwenden</Typography>
            <ApplyStep community={preview.community} rule={preview.rule} tariffs={tariffs} changedCount={changedCount}
                       checked={checked} onCheck={setChecked} busy={busy} onApply={runApply}
                       error={error?.op === "apply" ? error.view : null}/>
          </section>
        )}

        {result && (
          <section>
            <Divider sx={{mb: 2}}/>
            <Typography variant="h6" component="h2" gutterBottom>Ergebnis</Typography>
            <ApplyResult field={result.rule.field} result={result.data} previewRows={result.previewRows}
                         onDownload={rows => downloadCsv(csvFileName(result.tenant, result.rule.field, "result", todayIso()),
                           previewCsv(result.rule.field, rows))}/>
          </section>
        )}
      </Stack>
    </Box>
  );
};

export default BulkChangePage;
