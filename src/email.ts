/**
 * Email Punycode helpers.
 *
 * The Vatly API accepts Unicode domains directly and returns canonical ASCII
 * on output. These optional helpers are not API input requirements; encodeEmail
 * deliberately rejects non-ASCII local parts, while the API may store them.
 *
 * The implementation uses the WHATWG `URL` parser, which is specified
 * to apply UTS-46 / Punycode to hostnames and is available on Node 20+,
 * Workers, Vercel Edge, Deno, and the browser. If we later find a runtime
 * that doesn't honor IDN in URL hostnames, swap to the `punycode/` userland
 * package or `tr46`.
 */

const LOCAL_PART_DISALLOWED = /[^ -~]/;

function splitEmail(email: string): { local: string; domain: string } {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) {
    throw new TypeError(`Invalid email address: ${email}`);
  }
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

/** Convert a Unicode email like `user@bücher.de` to ASCII form `user@xn--bcher-kva.de`. */
export function encodeEmail(email: string): string {
  const { local, domain } = splitEmail(email);
  if (LOCAL_PART_DISALLOWED.test(local)) {
    throw new TypeError(
      `Vatly: non-ASCII local-part in email (${email}). SMTPUTF8 / EAI is not supported.`,
    );
  }
  return `${local}@${encodeDomain(domain)}`;
}

/** Convert an ASCII Punycode email back to Unicode form for display. */
export function decodeEmail(email: string): string {
  const { local, domain } = splitEmail(email);
  return `${local}@${decodeDomain(domain)}`;
}

/** Encode a domain to ASCII (Punycode). */
export function encodeDomain(domain: string): string {
  return parseHostVia(`http://${domain}/`, "encode");
}

/** Decode an ASCII (Punycode) domain back to Unicode. */
export function decodeDomain(domain: string): string {
  return parseHostVia(`http://${domain}/`, "decode");
}

function parseHostVia(urlStr: string, mode: "encode" | "decode"): string {
  try {
    const url = new URL(urlStr);
    if (mode === "encode") {
      // URL hostnames are ASCII-Punycode by default.
      return url.hostname;
    }
    // Decode requires the runtime to support Unicode hostnames. Use URL with
    // `host` to read the Punycode, then convert via `toUnicode` if available,
    // otherwise return the ASCII form (degrades gracefully — round-trip still
    // works for the API contract).
    const host = url.hostname;
    if (typeof (URL as unknown as { toUnicode?: (s: string) => string }).toUnicode === "function") {
      return (URL as unknown as { toUnicode: (s: string) => string }).toUnicode(host);
    }
    return host;
  } catch (err) {
    throw new TypeError(`Vatly: invalid domain "${urlStr}"`);
  }
}
