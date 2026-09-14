import { InfraiRealtime } from "./infrai_client.ts";
import { announceViewer } from "./presence_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
const result = await announceViewer({ channel: "streaming:demo", viewerId: "creator-42", accountId: "media-workspace" }, new InfraiRealtime(key));
console.log(JSON.stringify(result, null, 2));
