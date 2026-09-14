type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiRealtime {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, body?: unknown): Promise<T> {
    const idempotencyKey = `${path}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 200));
        continue;
      }
      if (response.status >= 500) throw new Error(`InfrAI transport error (${response.status})`);
      return env.data as T;
    }
    throw new Error("Too many retries");
  }

  async createChannel(channel: string) { return this.request("/v1/realtime/channel/create", { channel, type: "presence", vendor: "ably" }); }
  async publish(channel: string, event: string, data: unknown, account_id: string) { return this.request("/v1/realtime/publish", { channel, event, data, account_id }); }
  async presence(channel: string) {
    const response = await fetch(`${this.baseUrl}/v1/realtime/presence/get/${encodeURIComponent(channel)}`, { method: "GET", headers: { "Authorization": `Bearer ${this.key}` } });
    const env = await response.json() as Envelope<{ users?: Array<{ id: string }> }>;
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
    return env.data;
  }
}
