import assert from "node:assert/strict";
import { onlineViewerIds, announceViewer } from "../src/presence_service.ts";

assert.deepEqual(onlineViewerIds({ users: [{ id: "z" }, { id: "a" }] }), ["a", "z"]);
const calls: string[] = [];
const fake = { createChannel: async (c: string) => { calls.push(`create:${c}`); }, publish: async () => { calls.push("publish"); }, presence: async () => ({ users: [{ id: "viewer-2" }, { id: "viewer-1" }] }) } as any;
const result = await announceViewer({ channel: "streaming:test", viewerId: "viewer-1", accountId: "acct" }, fake);
assert.deepEqual(result.onlineViewerIds, ["viewer-1", "viewer-2"]);
assert.deepEqual(calls, ["create:streaming:test", "publish"]);
console.log("presence decision test passed");
