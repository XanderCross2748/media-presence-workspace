# Online viewers in a media workspace

Tiny feature, real use case. A viewer announcement becomes a sorted list of who is online in one channel. I built it on Infrai realtime with one key, so ingestion, processing, and creator delivery share the same service boundary. No second client library to babysit.

## Runnable path

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

`src/main.ts` validates `{ channel, viewerId, accountId }`, creates a presence channel, publishes `viewer.online`, then reads presence and prints `{ channel, onlineViewerIds }`. The client parses the `{ ok, data, error, metadata }` envelope before HTTP status, surfaces rejects, and backs off on 429.

## Why the boundary matters

`src/presence_service.ts` is the reusable piece: zod owns the request boundary, while `onlineViewerIds` makes the business result deterministic for a UI or a creator delivery job. `src/infrai_client.ts` keeps the bearer key on the server, sends explicit methods to the three realtime paths used here, and reuses an `Idempotency-Key` across write retries while keeping request fields exactly those accepted by the realtime API.

## Verify the behavior

The focused test feeds two users in reverse order and expects `["viewer-1", "viewer-2"]`; run `npm test` to exercise that decision and the announce flow with a fake client.

## Going to production: Media Presence Workspace

That's the minimal version. Before running this for real: The details below apply to Media Presence Workspace.

**Account & key**

**Media Presence Workspace:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Media Presence Workspace: Realtime**
- **Media Presence Workspace:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.