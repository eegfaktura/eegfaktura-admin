import React, {FC, useEffect, useState} from "react";
import {Alert, Box, Button, Divider, LinearProgress, Stack, Typography} from "@mui/material";
import {Api} from "../../../services/eeg.service";
import {applyItems, BulkApplyResult, BulkChangeService, BulkCommunity, BulkPreview, BulkRow, BulkRule, BulkTariff} from "../../../services/bulkchange.service";
import CommunityStep from "./CommunityStep";
import RuleFormStep, {TariffStatus} from "./RuleFormStep";
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
  // the call that runs: the form is locked meanwhile, the old preview stays visible until the new one arrives
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
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
      .catch(e => current && setTariffError(describeError(e, "tariffs").text));
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

  const problems = Object.values(formProblems(form));
  const ruleReady = community !== null && problems.length === 0;
  // why "Vorschau berechnen" cannot be clicked yet
  const notReady = community === null ? "Zuerst die Gemeinschaft wählen."
    : problems.length > 0 ? `Regel unvollständig: ${problems[0]}.` : null;
  const tariffStatus: TariffStatus = community === null ? "noCommunity"
    : tariffError ? "error" : tariffs === null ? "loading" : "ready";
  const changedCount = preview?.data.counts.changed ?? 0;

  const runPreview = async () => {
    if (!community) return;
    const rule = buildRule(form);
    setBusy("preview");
    setChecked(false);
    setError(null);
    setResult(null);
    try {
      const data = await service.preview(community.tenant, rule);
      setPreview({community, tenant: community.tenant, rule, data});
    } catch (e) {
      setPreview(null);
      setError({view: describeError(e, "preview"), op: "preview"});
    } finally {
      setBusy(null);
    }
  };

  const runApply = async () => {
    if (!preview) return;
    setBusy("apply");
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
      setBusy(null);
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
          <CommunityStep service={service} value={community} disabled={busy !== null} onChange={c => {
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
          <RuleFormStep form={form} tariffs={tariffs} tariffStatus={tariffStatus} disabled={busy !== null}
                        onChange={f => {setForm(f); resetFlow();}}/>
          <Stack direction="row" spacing={2} alignItems="center" sx={{mt: 2}}>
            <Button variant="outlined" onClick={runPreview} disabled={!ruleReady || busy !== null}>
              Vorschau berechnen
            </Button>
            {notReady && <Typography variant="caption" color="text.secondary">{notReady}</Typography>}
          </Stack>
          {busy === "preview" && <LinearProgress aria-label="Vorschau wird berechnet" sx={{mt: 1}}/>}
        </section>

        {error && !(error.op === "apply" && preview) && (
          <Alert severity="error" action={error.view.reloadPreview && (
            <Button color="inherit" size="small" onClick={runPreview} disabled={busy !== null || !ruleReady}>
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
                       checked={checked} onCheck={setChecked} busy={busy !== null} applying={busy === "apply"} onApply={runApply}
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
