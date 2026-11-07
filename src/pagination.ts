/**
 * Cursor pagination utilities for Vatly list endpoints.
 *
 * Vatly responses follow the shape:
 *   { data: T[], count: number, links: { self, next, prev } }
 *
 * `links.next.href` is the URL of the next page; we extract its `startingAfter`
 * cursor and pass it back to the same list method.
 */

import type { PaginationLinks } from "./types.js";

export interface PaginatedList<T> {
  data: T[];
  count: number;
  links: PaginationLinks;
}

export interface ListParams {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
}

export type Pager<T, P extends ListParams = ListParams> = (params: P) => Promise<PaginatedList<T>>;

/**
 * Wrap a list method so callers can use `for await` to walk every item.
 * Stops as soon as `links.next` is null.
 */
export async function* paginate<T, P extends ListParams = ListParams>(
  pager: Pager<T, P>,
  params: P,
): AsyncIterableIterator<T> {
  let cursor: string | undefined = params.startingAfter;
  let first = true;
  const seen = new Set<string>();
  if (cursor) seen.add(cursor);

  while (true) {
    const pageParams: P = first
      ? params
      : ({ ...params, startingAfter: cursor, endingBefore: undefined } as P);
    first = false;

    const page = await pager(pageParams);
    for (const item of page.data) yield item;

    if (!page.links.next) return;
    const next = extractStartingAfter(page.links.next.href);
    if (!next || seen.has(next)) throw new Error("Vatly: invalid or repeated pagination cursor.");
    seen.add(next);
    cursor = next;
  }
}

/** Pull the `startingAfter` query value out of a next-link URL. */
export function extractStartingAfter(href: string): string | undefined {
  try {
    const url = new URL(href, "https://api.vatly.com");
    return url.searchParams.get("startingAfter") ?? undefined;
  } catch {
    return undefined;
  }
}
