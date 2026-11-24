import React, {FC, useMemo, useState} from "react";
import {Alert, Box, Button, Chip, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography} from "@mui/material";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {BulkField, BulkPreview, BulkRow, rowKey} from "../../../services/bulkchange.service";
import {CLASS_LABELS, codeText, ERROR_TEXTS, HINT_TEXTS, RUN_HINT_TEXTS} from "./texts";

// Step 3: counts per class, run hints on top, filters and the table old → new with hint and error chips.

export const RunHints: FC<{ codes: string[] }> = ({codes}) => (
  <>
    {codes.map(c => (
      <Alert key={c} severity={c === "L3" ? "info" : "warning"}>
        <strong>{c}</strong> {RUN_HINT_TEXTS[c] ?? `Unbekannter Code ${c}`}
      </Alert>
    ))}
  </>
);

const RowChips: FC<{ row: BulkRow }> = ({row}) => (
  <Stack direction="row" spacing={0.5} sx={{flexWrap: "wrap"}}>
    {row.error && (
      <Tooltip title={codeText(ERROR_TEXTS, row.error).long}>
        <Chip size="small" color="error" label={`${row.error} ${codeText(ERROR_TEXTS, row.error).short}`}/>
      </Tooltip>
    )}
    {row.hints.map(h => (
      <Tooltip key={h} title={codeText(HINT_TEXTS, h).long}>
        <Chip size="small" color="warning" label={`${h} ${codeText(HINT_TEXTS, h).short}`}/>
      </Tooltip>
    ))}
  </Stack>
);

export const RowsTable: FC<{ field: BulkField, rows: BulkRow[] }> = ({field, rows}) => {
  const columns: GridColDef<BulkRow>[] = [
    {field: "participantNumber", headerName: "Mitgl.-Nr.", width: 110},
    {field: "name", headerName: "Name", flex: 1, minWidth: 160},
    ...(field === "METER_TARIFF"
      ? [{field: "meteringPointId", headerName: "Zählpunkt", width: 290} as GridColDef<BulkRow>] : []),
    {field: "oldText", headerName: "bisher", flex: 1, minWidth: 140},
    {field: "newText", headerName: "neu", flex: 1, minWidth: 140},
    {field: "class", headerName: "Ergebnis", width: 230, valueGetter: p => CLASS_LABELS[p.row.class] ?? p.row.class},
    {field: "hints", headerName: "Hinweis / Fehler", flex: 1, minWidth: 220, sortable: false,
      renderCell: p => <RowChips row={p.row}/>},
  ];
  return (
    <Box sx={{height: 520, width: "100%", backgroundColor: "white"}}>
      <DataGrid rows={rows} columns={columns} getRowId={rowKey} density="compact" disableRowSelectionOnClick
                initialState={{pagination: {paginationModel: {pageSize: 100}}}} pageSizeOptions={[25, 100]}/>
    </Box>
  );
};

type Filter = "all" | "changed" | "hint" | "error" | "unchanged";

const FILTERS: Record<Filter, (r: BulkRow) => boolean> = {
  all: () => true,
  changed: r => r.class === "CHANGED",
  hint: r => r.class === "CHANGED" && r.hints.length > 0,
  error: r => r.class === "ERROR",
  unchanged: r => r.class === "UNCHANGED_CONDITION" || r.class === "UNCHANGED_TARGET",
};

const PreviewTable: FC<{ field: BulkField, preview: BulkPreview, onDownload: () => void }> = ({field, preview, onDownload}) => {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => preview.rows.filter(FILTERS[filter]), [preview, filter]);
  const c = preview.counts;
  return (
    <Stack spacing={2}>
      <RunHints codes={preview.runHints}/>
      <Typography>
        <strong>{c.changed} geändert</strong> (davon {c.withHint} mit Hinweis) · {c.unchangedCondition + c.unchangedTarget}
        {" "}unverändert ({c.unchangedCondition} Bedingung nicht erfüllt, {c.unchangedTarget} haben schon den
        Zielwert) · <Box component="span" sx={{color: c.errors ? "error.main" : undefined}}>{c.errors} Fehler (werden
        nicht geändert)</Box>
      </Typography>
      <Stack direction={{xs: "column", md: "row"}} spacing={2} justifyContent="space-between">
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)}>
          <ToggleButton value="all">alle ({preview.rows.length})</ToggleButton>
          <ToggleButton value="changed">geändert ({c.changed})</ToggleButton>
          <ToggleButton value="hint">mit Hinweis ({c.withHint})</ToggleButton>
          <ToggleButton value="error">Fehler ({c.errors})</ToggleButton>
          <ToggleButton value="unchanged">unverändert ({c.unchangedCondition + c.unchangedTarget})</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" onClick={onDownload} disabled={preview.rows.length === 0}>
          Herunterladen (CSV)
        </Button>
      </Stack>
      {preview.rows.length === 0
        ? <Alert severity="info">Die Regel trifft kein Mitglied dieser Gemeinschaft.</Alert>
        : <RowsTable field={field} rows={rows}/>}
    </Stack>
  );
};

export default PreviewTable;
