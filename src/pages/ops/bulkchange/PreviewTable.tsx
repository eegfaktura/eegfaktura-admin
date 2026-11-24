import React, {FC, useMemo, useState} from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Stack, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography
} from "@mui/material";
import {ErrorOutline, ExpandMore, WarningAmberOutlined} from "@mui/icons-material";
import {DataGrid, deDE, GridColDef} from "@mui/x-data-grid";
import {BulkField, BulkPreview, BulkRow, rowKey} from "../../../services/bulkchange.service";
import {CLASS_LABELS, codeText, ERROR_TEXTS, HINT_TEXTS, RUN_HINT_TEXTS} from "./texts";

// Step 3: counts per class, run hints on top, filters, the table old → new with hint and error chips, and a
// legend of the codes in this preview.

export const RunHints: FC<{ codes: string[] }> = ({codes}) => (
  <>
    {codes.map(c => (
      <Alert key={c} severity={c === "L3" ? "info" : "warning"}>
        <strong>{c}</strong> {RUN_HINT_TEXTS[c] ?? `Unbekannter Code ${c}`}
      </Alert>
    ))}
  </>
);

// hints light like a warning alert, errors red filled; the long text in the tooltip and in the legend
const hintChipSx = {bgcolor: "#fff4e5", color: "#663c00", borderColor: "#ffb74d", "& .MuiChip-icon": {color: "#ed6c02"}};

// several chips wrap onto their own lines with a gap (Stack spacing would shift the wrapped ones);
// the grid row grows with them (getRowHeight "auto")
const RowChips: FC<{ row: BulkRow }> = ({row}) => (
  <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5}}>
    {row.error && (
      <Tooltip title={codeText(ERROR_TEXTS, row.error).long}>
        <Chip size="small" color="error" icon={<ErrorOutline/>}
              label={`${row.error} ${codeText(ERROR_TEXTS, row.error).short}`}/>
      </Tooltip>
    )}
    {row.hints.map(h => (
      <Tooltip key={h} title={codeText(HINT_TEXTS, h).long}>
        <Chip size="small" variant="outlined" sx={hintChipSx} icon={<WarningAmberOutlined/>}
              label={`${h} ${codeText(HINT_TEXTS, h).short}`}/>
      </Tooltip>
    ))}
  </Box>
);

const localeText = deDE.components.MuiDataGrid.defaultProps.localeText;
const autoRowHeight = () => "auto" as const;

const columnsFor = (field: BulkField): GridColDef<BulkRow>[] => [
  {field: "participantNumber", headerName: "Mitgl.-Nr.", width: 110},
  {field: "name", headerName: "Name", flex: 1, minWidth: 160},
  ...(field === "METER_TARIFF"
    ? [{field: "meteringPointId", headerName: "Zählpunkt", width: 250} as GridColDef<BulkRow>] : []),
  {field: "oldText", headerName: "Bisher", flex: 1, minWidth: 140},
  {field: "newText", headerName: "Neu", flex: 1, minWidth: 140},
  {field: "class", headerName: "Ergebnis", width: 180, valueGetter: p => CLASS_LABELS[p.row.class] ?? p.row.class},
  {field: "hints", headerName: "Hinweis / Fehler", flex: 1, minWidth: 220, sortable: false,
    renderCell: p => <RowChips row={p.row}/>},
];

export const RowsTable: FC<{ field: BulkField, rows: BulkRow[] }> = ({field, rows}) => {
  // stable columns: new column objects on every render make the grid recompute its layout
  const columns = useMemo(() => columnsFor(field), [field]);
  return (
    <Box sx={{height: "min(520px, 60vh)", width: "100%", backgroundColor: "white"}}>
      <DataGrid rows={rows} columns={columns} getRowId={rowKey} density="compact" disableRowSelectionOnClick
                disableColumnFilter localeText={localeText} getRowHeight={autoRowHeight}
                sx={{"& .MuiDataGrid-cell": {py: 0.75}}}
                initialState={{pagination: {paginationModel: {pageSize: 100}}}} pageSizeOptions={[25, 100]}/>
    </Box>
  );
};

// The error and hint codes that occur in the rows, F before H, by number.
export const presentCodes = (rows: BulkRow[]) => {
  const codes = new Set<string>();
  rows.forEach(r => {
    if (r.error) codes.add(r.error);
    r.hints.forEach(h => codes.add(h));
  });
  return Array.from(codes).sort((a, b) => a[0] === b[0] ? Number(a.slice(1)) - Number(b.slice(1)) : a < b ? -1 : 1);
};

const Legend: FC<{ rows: BulkRow[] }> = ({rows}) => {
  const codes = presentCodes(rows);
  if (codes.length === 0) return null;
  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMore/>}>Bedeutung der Hinweise und Fehler</AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          {codes.map(c => (
            <Typography key={c} variant="body2">
              <strong>{c}</strong> {codeText(c.startsWith("F") ? ERROR_TEXTS : HINT_TEXTS, c).long}
            </Typography>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export type Filter = "all" | "changed" | "hint" | "error" | "unchanged";

const FILTERS: Record<Filter, (r: BulkRow) => boolean> = {
  all: () => true,
  changed: r => r.class === "CHANGED",
  hint: r => r.class === "CHANGED" && r.hints.length > 0,
  error: r => r.class === "ERROR",
  unchanged: r => r.class === "UNCHANGED_CONDITION" || r.class === "UNCHANGED_TARGET",
};

export const num = (n: number) => n.toLocaleString("de-AT");

// e.g. "1 geändert (davon 1 mit Hinweis) · 2 unverändert (1 Bedingung nicht erfüllt, 1 hat schon den Zielwert) · …"
export function countsLine(c: BulkPreview["counts"]): string {
  const unchanged = c.unchangedCondition + c.unchangedTarget;
  return `${num(c.changed)} geändert (davon ${num(c.withHint)} mit Hinweis) · ${num(unchanged)} unverändert `
    + `(${num(c.unchangedCondition)} Bedingung nicht erfüllt, ${num(c.unchangedTarget)} `
    + `${c.unchangedTarget === 1 ? "hat" : "haben"} schon den Zielwert) · ${num(c.errors)} Fehler `
    + `(${c.errors === 1 ? "wird" : "werden"} nicht geändert)`;
}

const PreviewTable: FC<{ field: BulkField, preview: BulkPreview, onDownload: (rows: BulkRow[], filter: Filter) => void }> = ({field, preview, onDownload}) => {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => preview.rows.filter(FILTERS[filter]), [preview, filter]);
  const c = preview.counts;
  return (
    <Stack spacing={2}>
      <RunHints codes={preview.runHints}/>
      <Typography sx={{fontWeight: 500}}>{countsLine(c)}</Typography>
      <Stack direction={{xs: "column", md: "row"}} spacing={2} justifyContent="space-between">
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)}>
          <ToggleButton value="all">alle ({num(preview.rows.length)})</ToggleButton>
          <ToggleButton value="changed">geändert ({num(c.changed)})</ToggleButton>
          <ToggleButton value="hint">mit Hinweis ({num(c.withHint)})</ToggleButton>
          <ToggleButton value="error">Fehler ({num(c.errors)})</ToggleButton>
          <ToggleButton value="unchanged">unverändert ({num(c.unchangedCondition + c.unchangedTarget)})</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" onClick={() => onDownload(rows, filter)} disabled={rows.length === 0}>
          Herunterladen (CSV)
        </Button>
      </Stack>
      {preview.rows.length === 0
        ? <Alert severity="info">Die Regel trifft kein Mitglied dieser Gemeinschaft.</Alert>
        : <RowsTable field={field} rows={rows}/>}
      <Legend rows={preview.rows}/>
    </Stack>
  );
};

export default PreviewTable;
