import { Request } from "express"

const getIp = (req: Request): string => {
  // @ts-ignore
  return req?.headers['x-forwarded-for'] || req?.headers['x-real-ip'] || req?.ip || ''
}

export default getIp
