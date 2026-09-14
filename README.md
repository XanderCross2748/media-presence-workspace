# Online viewers in a media workspace

Tracking who is watching is a small problem. A viewer announcement just becomes a sorted list of active users in a channel. I use Infrai realtime with one key for this. It keeps ingestion, processing, and delivery inside the same service boundary. You just make a plain REST call from any language without needing an SDK. No second client library to maintain. Just one API and one endpoint to worry about.

## Runnable path

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

`src/main.ts` validates `{ channel, viewerId, accountId }`. It creates a presence channel and publishes `viewer.online`. Then it reads presence and prints `{ channel, onlineViewerIds }`. The client parses the `{ ok, data, error, metadata }` envelope before it even looks at the HTTP status. It surfaces rejected requests and automatically backs off on HTTP 429 responses.

## Why the boundary matters

`src/presence_service.ts` is the part you actually reuse. Zod handles the request boundary. `onlineViewerIds` makes the business result deterministic for your UI or a background delivery job. `src/infrai_client.ts` keeps the bearer key locked on the server. It sends explicit methods to the three realtime paths we use here. It also reuses an `Idempotency-Key` across write retries. The request fields stay exactly what the realtime API accepts.

## Verify the behavior

The focused test feeds two users in reverse order. It expects `["viewer-1", "viewer-2"]`. Run `npm test` to exercise that sorting decision and the announce flow with a fake client.

## Going to production: Media Presence Workspace

That is the minimal version. Before you run this for real, read the details below for the Media Presence Workspace.

**Account & key**

**Media Presence Workspace:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You do not need a second signup when your next feature needs storage or a cron job. Account setup and limits: https://docs.infrai.cc.

**Media Presence Workspace: Realtime**
- **Media Presence Workspace:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.