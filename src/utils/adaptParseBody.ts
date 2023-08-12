import { Request } from "express"

const tryParseJSON = (obj: any) => {
  try {
    return JSON.parse(obj)
  } catch {
    return obj
  }
}

const adaptParseBody = (req: Request): Record<string, any> => {
  const _body: Record<string, any> = {}
  const { query, body } = req
  for (const key in query) {
    _body[key] = tryParseJSON(query[key])
  }
  for (const key in body) {
    _body[key] = tryParseJSON(body[key])
  }
  return _body
}

export default adaptParseBody
