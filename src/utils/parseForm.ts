import type { Request } from "express";
import type { ParsedQs } from "qs";

type ParsedQsValue = string | ParsedQs | string[] | ParsedQs[] | undefined;

const tryParseQsToJSON = (q: ParsedQsValue): any => {
  if (!q) return q;
  if (typeof q === "string") {
    try {
      return JSON.parse(q);
    } catch {
      return q;
    }
  }
  if (Array.isArray(q)) return q.map((i) => tryParseQsToJSON(i));
  for (const k in q) q[k] = tryParseQsToJSON(q[k]);
  return q;
};

const parseForm = <T extends { [key: string]: any }>(req: Request) => {
  const { query, body: _body } = req;
  const body: Partial<T> = typeof _body === "object" ? { ..._body } : {};
  for (const key in query) {
    if (key in body) continue;
    body[key as keyof T] = tryParseQsToJSON(query[key]);
  }
  return body;
};

export default parseForm;
