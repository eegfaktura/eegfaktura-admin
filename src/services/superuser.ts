// Liest die Realm-Rollen aus dem Access-Token.
//
// WICHTIG: Das ist eine Anzeige-Entscheidung, KEINE Sicherheitsmaßnahme. Durchgesetzt
// wird die Berechtigung ausschließlich serverseitig (admin-backend verlangt `superuser`
// auf allen Routen, energystore zusätzlich am Lösch-Endpunkt). Der Token wird hier
// bewusst nur dekodiert und nicht verifiziert — eine Signaturprüfung im Browser würde
// nichts absichern, was der Server nicht ohnehin selbst entscheidet.
//
// Zweck ist allein, dass jemand ohne die Rolle eine verständliche Meldung sieht statt
// einer Oberfläche, die benutzbar aussieht und bei jeder Aktion mit 403 abbricht.

export const SUPERUSER_ROLE = "superuser";

/** Dekodiert die Payload eines JWT. Gibt null zurück, wenn das Format nicht passt. */
function decodePayload(token: string): any | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    // atob liefert Bytes; der Umweg über die Prozent-Kodierung ist nötig, damit
    // Umlaute in Claims nicht zerfallen.
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(padded), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function hasSuperuserRole(accessToken?: string | null): boolean {
  if (!accessToken) return false;
  const payload = decodePayload(accessToken);
  const roles = payload?.realm_access?.roles;
  return Array.isArray(roles) && roles.includes(SUPERUSER_ROLE);
}
