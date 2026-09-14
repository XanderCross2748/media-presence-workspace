import { z } from "zod";
import { InfraiRealtime } from "./infrai_client.ts";

export const viewerRequest = z.object({ channel: z.string().min(1), viewerId: z.string().min(1), accountId: z.string().min(1) });
export type ViewerRequest = z.infer<typeof viewerRequest>;

export function onlineViewerIds(payload: { users?: Array<{ id: string }> } | undefined): string[] {
  return (payload?.users ?? []).map((user) => user.id).sort();
}

export async function announceViewer(input: unknown, client: InfraiRealtime) {
  const request = viewerRequest.parse(input);
  await client.createChannel(request.channel);
  await client.publish(request.channel, "viewer.online", { viewerId: request.viewerId }, request.accountId);
  const presence = await client.presence(request.channel);
  return { channel: request.channel, onlineViewerIds: onlineViewerIds(presence) };
}
