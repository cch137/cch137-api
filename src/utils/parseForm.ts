import type { Request } from "express";
import type { ParsedQs } from "qs";

type ParsedQsValue = string | ParsedQs | string[] | ParsedQs[] | undefined;

const tryParseJSON = (obj: any) => {
  try {
    if (typeof obj === "string") return JSON.parse(obj);
  } catch {}
  return obj;
};

const tryParseQsToJSON = (q: ParsedQsValue): any => {
  if (!q) return q;
  if (typeof q === "string") return tryParseJSON(q);
  if (Array.isArray(q)) return q.map((i) => tryParseQsToJSON(i));
  for (const k in q) q[k] = tryParseQsToJSON(q[k]);
  return q;
};

const parseForm = <T extends { [key: string]: any }>(req: Request) => {
  const _body: Partial<T> = {};
  const { query, body } = req;
  for (const key in query) _body[key as keyof T] = tryParseQsToJSON(query[key]);
  for (const key in body) _body[key as keyof T] = tryParseJSON(body[key]);
  return _body;
};

export default parseForm;
