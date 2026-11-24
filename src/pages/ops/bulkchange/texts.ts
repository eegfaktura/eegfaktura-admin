import {BulkAction, BulkChangeError, BulkClass, BulkCondition, BulkDirection, BulkField} from "../../../services/bulkchange.service";

// German texts of the bulk change page. backend sends codes (classes, F1–F6, H1–H9, L1–L3, skip reasons,
// error codes 6100–6107); the texts belong to admin (konzept-massenaenderungen.md, Fachliche Logik 7 and 8).

export const FIELD_LABELS: Record<BulkField, string> = {
  DEBIT_TYPE: "Einzugsart",
  MANDATE_REFERENCE: "Mandatsreferenz",
  MANDATE_DATE: "Mandatsdatum",
  PARTICIPANT_TARIFF: "Mitgliedstarif",
  METER_TARIFF: "Zählpunkttarif",
};

export const ACTION_LABELS: Record<BulkAction, string> = {
  SET: "Wert setzen",
  CLEAR: "leer setzen",
  COPY: "aus Mitgliedsnummer kopieren",
};

// "leer setzen" reads differently per field: an empty tariff is "kein Tarif".
export const clearLabel = (field: BulkField) =>
  field === "PARTICIPANT_TARIFF" || field === "METER_TARIFF" ? "kein Tarif"
    : field === "MANDATE_REFERENCE" ? "leer setzen (Mitgliedsnummer gilt)"
      : field === "MANDATE_DATE" ? "leer setzen („Mitglied seit“ gilt)"
        : "leer setzen (nicht gewählt)";

export const CONDITION_LABELS: Record<BulkCondition, string> = {
  ALL: "alle",
  EMPTY: "nur wo leer",
  EQUALS: "nur wo gleich …",
};

export const DIRECTION_LABELS: Record<BulkDirection, string> = {
  CONSUMPTION: "Verbrauch",
  GENERATOR: "Erzeugung",
};

export const DEBIT_TYPE_LABELS: Record<string, string> = {
  CORE: "CORE (normale Lastschrift)",
  B2B: "B2B (Firmenlastschrift)",
  NONE: "Kein SEPA",
};

export const CLASS_LABELS: Record<BulkClass, string> = {
  CHANGED: "geändert",
  UNCHANGED_CONDITION: "unverändert: Bedingung nicht erfüllt",
  UNCHANGED_TARGET: "unverändert: hat schon den Zielwert",
  ERROR: "Fehler — wird nicht geändert",
};

export interface CodeText {
  short: string;
  long: string;
}

export const ERROR_TEXTS: Record<string, CodeText> = {
  F1: {short: "Referenz ungültig", long: "Die Mandatsreferenz wäre ungültig: höchstens 35 Zeichen, nur Buchstaben, Ziffern und + ? / - : ( ) . , ' (keine Leerzeichen, keine Umlaute)."},
  F2: {short: "Referenz vergeben", long: "Referenz bereits vergeben (in dieser oder einer EEG mit derselben Gläubiger-ID)."},
  F3: {short: "Datum ungültig", long: "Das Mandatsdatum ist ungültig oder liegt in der Zukunft."},
  F4: {short: "Tarif passt nicht", long: "Der Tarif passt nicht: nicht in dieser Gemeinschaft, archiviert, falscher Typ oder falsche Richtung."},
  F5: {short: "Quellfeld leer", long: "Die Mitgliedsnummer ist leer; der Wert bleibt, wie er ist."},
  F6: {short: "keine Bankverbindung", long: "Das Mitglied hat keine Bankverbindung; es wird keine angelegt."},
};

export const HINT_TEXTS: Record<string, CodeText> = {
  H1: {short: "keine IBAN", long: "Keine IBAN: Das Mitglied fehlt in der Lastschrift-Datei für die Bank. eegFaktura lässt Mitglieder ohne IBAN dort weg und listet sie beim Export auf."},
  H2: {short: "ohne Mandatsreferenz", long: "Ohne wirksame Mandatsreferenz: Die Lastschrift geht ohne Mandatskennung hinaus."},
  H3: {short: "ohne Mandatsdatum", long: "Ohne wirksames Mandatsdatum: Weder Mandatsdatum noch „Mitglied seit“ ist gesetzt; das Unterschriftsdatum bleibt leer."},
  H4: {short: "Referenz ungültig/doppelt", long: "Die neue Einzugsart macht eine ungültige oder doppelte Mandatsreferenz wirksam (auch in einer EEG mit derselben Gläubiger-ID)."},
  H5: {short: "B2B bei Privatperson", long: "B2B (Firmenlastschrift) gibt es nur für Unternehmen; das Mitglied ist als Privatperson geführt."},
  H6: {short: "Mandatsänderung", long: "Die wirksame Mandatsreferenz ändert sich bei einem Mitglied, das schon per Lastschrift zahlt; die Bank erfährt von der Mandatsänderung nichts."},
  H7: {short: "Beitrittsgebühr", long: "Der neue Tarif hat eine Beitrittsgebühr: fällig bei der ersten Energieabrechnung des Mitglieds, sonst über „Gebühr anfordern“."},
  H8: {short: "dritter USt-Satz", long: "Der USt-Satz der Beitrittsgebühr ist weder 0 % noch in der Gemeinschaft schon verwendet: Ein dritter USt-Satz auf einer Rechnung bricht die Abrechnung ab."},
  H9: {short: "kein Tarif", long: "Kein Tarif: Preis und Beitrittsgebühr fehlen in der Abrechnung."},
};

export const RUN_HINT_TEXTS: Record<string, string> = {
  L1: "Der Gemeinschaft fehlt IBAN oder BIC: Der Lastschrift-Export bricht ganz ab, auch die Überweisungen.",
  L2: "Die Gemeinschaft hat keine Gläubiger-ID: Es entsteht keine Lastschrift-Datei.",
  L3: "Die Änderung gilt für die nächste Abrechnung (P2P/Eigenversorgung: den nächsten Vorschau-Lauf); ein schon gerechneter Vorschau-Lauf muss wiederholt werden. Erstellte Rechnungen und Lastschrift-Dateien bleiben, wie sie sind.",
};

export const SKIP_TEXTS: Record<string, string> = {
  CHANGED_SINCE_PREVIEW: "Seit der Vorschau geändert — nicht geschrieben.",
  ...Object.fromEntries(Object.entries(ERROR_TEXTS).map(([k, v]) => [k, v.long])),
};

// Text of a code; an unknown code (newer backend) is shown as it is rather than hidden.
export const codeText = (table: Record<string, CodeText>, code: string): CodeText =>
  table[code] ?? {short: code, long: `Unbekannter Code ${code}`};

export type BulkOperation = "communities" | "preview" | "apply";

export interface ErrorView {
  text: string;
  // the preview no longer matches the data: offer to compute it again
  reloadPreview: boolean;
}

// A failed call as the support reads it. Only the rule error (6100) and the failure (6105) carry the server's
// text, which says which part of the rule is wrong or whether the outcome of apply is unclear.
export function describeError(e: unknown, op: BulkOperation): ErrorView {
  const err = e instanceof BulkChangeError ? e : new BulkChangeError(0, 0, "");
  const server = err.serverText ? ` (${err.serverText})` : "";
  const view = (text: string, reloadPreview = false) => ({text, reloadPreview});
  if (err.status === 0 || err.status >= 500) {
    if (op === "apply") {
      return view("Das Anwenden ist fehlgeschlagen oder ohne Antwort geblieben. "
        + (err.code === 6105 && err.serverText ? err.serverText : "Das Ergebnis ist unklar.")
        + " Bitte die Vorschau neu berechnen und prüfen, was schon geändert ist.", true);
    }
    return view(`Der Server konnte die Anfrage nicht verarbeiten (${err.status || "keine Antwort"}); `
      + "bitte später erneut versuchen.");
  }
  switch (err.status) {
    case 401:
      return view("Nicht angemeldet oder Sitzung abgelaufen (401). Bitte neu anmelden.");
    case 403:
      return err.code === 6106
        ? view("Im Anmelde-Token fehlt der Benutzername; die Massenänderung wird nicht ausgeführt (403).")
        : view("Keine Berechtigung (403). Die Massenänderung setzt die Realm-Rolle „superuser“ voraus; "
          + "nach einer neuen Zuweisung einmal ab- und anmelden.");
    case 404:
      return view("Die Gemeinschaft ist unbekannt (404). Bitte die Liste neu laden.");
    case 409:
      return view("Für diese Gemeinschaft oder Gläubiger-ID läuft gerade eine Massenänderung, oder ein Tarif "
        + "wird archiviert (409). Nichts geändert; bitte gleich noch einmal versuchen.");
    case 413:
      return view("Zu viele Treffer für einen Lauf (413). Nichts geändert; bitte die Regel mit einer Bedingung "
        + "enger fassen und in mehreren Läufen ändern.");
    case 400:
      if (err.code === 6102) {
        return view("Vorschau veraltet: Ein Treffer gehört nicht (mehr) zur Gemeinschaft (400). Nichts geändert; "
          + "bitte die Vorschau neu berechnen.", true);
      }
      if (err.code === 6101) {
        return view("Ein Treffer ist doppelt in der Anfrage (400). Nichts geändert; bitte die Vorschau neu "
          + "berechnen.", true);
      }
      return view(`Die Regel ist ungültig (400)${server}.`);
  }
  return view(`Anfrage fehlgeschlagen (${err.status})${server}.`);
}
