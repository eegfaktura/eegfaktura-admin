# Bulk change — contract fixtures (copies)

Copies of `api/testdata/bulkchange/*.json` of **eegfaktura-backend**, branch `feat/bulk-change`
(eegfaktura/eegfaktura-backend#165), **source commit `cdd64aace8aef18c81ab8fe810918bffa25032da`**.
The files are unchanged; backend's `api/bulkChangeContract_test.go` checks the same files against its handlers,
`src/services/bulkchange.contract.test.ts` checks the admin side against these copies.

A change in backend is a contract change: copy the files again, update the commit above and the CHANGELOG.

| File | Route |
|---|---|
| `communities.response.json` | `GET /api/bulkchange/communities` |
| `preview.request.json`, `preview.response.json` | `POST /api/bulkchange/preview` (header `tenant`) |
| `apply.request.json`, `apply.response.json` | `POST /api/bulkchange/apply` (header `tenant`) |
| `error.response.json` | error body of all routes (here 409, code 6104) |
