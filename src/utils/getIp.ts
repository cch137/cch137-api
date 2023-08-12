const getIp = (req: any): string => {
  return req?.headers['x-forwarded-for'] || req?.headers['x-real-ip'] || req?.ip || ''
}

export default getIp
