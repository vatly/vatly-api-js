// Shared helpers for tests. Not part of the public SDK surface.

export interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

export interface MockResponseInit {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Delay before resolving the fetch, in ms. Useful for timeout tests. */
  delayMs?: number;
  /** Throw a network-layer error instead of returning a Response. */
  networkError?: Error;
}

/** Build a recording fetch that returns the given sequence of responses. */
export function makeFetchSequence(responses: MockResponseInit[]) {
  const calls: MockCall[] = [];
  let i = 0;
  const fetchFn: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const method = (init?.method ?? "GET").toUpperCase();
    const headers: Record<string, string> = {};
    const h = init?.headers;
    if (h) {
      if (h instanceof Headers) {
        h.forEach((v, k) => {
          headers[k] = v;
        });
      } else if (Array.isArray(h)) {
        for (const [k, v] of h) headers[k.toLowerCase()] = v;
      } else {
        for (const [k, v] of Object.entries(h)) headers[k.toLowerCase()] = String(v);
      }
    }
    const body = typeof init?.body === "string" ? (init.body as string) : undefined;
    calls.push({ url, method, headers, body });

    const spec = responses[i] ?? responses[responses.length - 1];
    i++;
    if (!spec) throw new Error("makeFetchSequence: no response configured");

    if (spec.delayMs) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, spec.delayMs);
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            const err = new Error("Aborted");
            (err as { name: string }).name = "AbortError";
            reject(err);
          });
        }
      });
    }

    if (spec.networkError) throw spec.networkError;

    const respHeaders = new Headers(spec.headers ?? {});
    const payload =
      spec.body === undefined
        ? null
        : typeof spec.body === "string"
          ? spec.body
          : JSON.stringify(spec.body);
    return new Response(payload, {
      status: spec.status ?? 200,
      headers: respHeaders,
    });
  };
  return { fetch: fetchFn, calls };
}
