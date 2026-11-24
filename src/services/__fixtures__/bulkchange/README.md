# Bulk change — contract fixtures (copies)

Copies of `api/testdata/bulkchange/*.json` of **eegfaktura-backend**, branch `feat/bulk-change-from-file`
(value from file, konzept Teil 2), **source commit `6d8a4a936b3f33312b3905a0ba2beb82bdb86c51`**; the files of
the first release (eegfaktura/eegfaktura-backend#165) are unchanged there.
The files are unchanged; backend's `api/bulkChangeContract_test.go` checks the same files against its handlers,
`src/services/bulkchange.contract.test.ts` checks the admin side against these copies.

A change in backend is a contract change: copy the files again, update the commit above and the CHANGELOG.

| File | Route |
|---|---|
| `communities.response.json` | `GET /api/bulkchange/communities` |
| `tariffs.response.json` | `GET /api/bulkchange/tariffs` (header `tenant`) |
| `preview.request.json`, `preview.response.json` | `POST /api/bulkchange/preview` (header `tenant`) |
| `preview.empty.response.json` | the same, a rule without hits (`rows` an empty list) |
| `apply.request.json`, `apply.response.json` | `POST /api/bulkchange/apply` (header `tenant`) |
| `preview.file.request.json`, `preview.file.response.json` | `POST /api/bulkchange/preview`, action `FROM_FILE` |
| `apply.file.request.json`, `apply.file.response.json` | `POST /api/bulkchange/apply`, action `FROM_FILE` |
| `error.response.json` | error body of all routes (here 409, code 6104) |
