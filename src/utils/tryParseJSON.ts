export default function tryParseJSON (obj: any) {
  try {
    return JSON.parse(obj)
  } catch {
    return obj
  }
}