// Nutzlast für die Admin-Update-Endpunkte (/admin/master/update[/participant|/eeg]).
// Entspricht dem UpdateMessage-Record im eegfaktura-admin-backend:
// updateClass wird im PortalService gesetzt, hier kommen tenant/participantId/
// meteringPoint (optional je nach Update-Klasse) und die value-Map dazu.
export interface AdminUpdateData {
  tenant?: string;
  participantId?: string;
  meteringPoint?: string;
  value: Record<string, any>;
}
