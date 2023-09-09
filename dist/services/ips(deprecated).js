"use strict";
// import _ipLocation from 'iplocation';
// import { ipCollection } from './mongoose';
// interface FullIpLocation {
//   latitude: number;
//   longitude: number;
//   city: string;
//   reserved: boolean;
//   region: {
//     name: string;
//     code: string;
//   };
//   country: {
//     name: string;
//     code: string;
//     iso3: string;
//     capital: string;
//     tld: string;
//     population: number;
//     area: number;
//     callingCode: string;
//     postalCode: string;
//     timezone: {
//       code: string;
//       offset: string;
//     };
//     currency: {
//       name: string;
//       code: string;
//     };
//     languages: string[];
//   };
//   continent: {
//     code: string;
//     inEu: boolean;
//   };
// }
// interface IpLocation {
//   ip: string;
//   mtime?: number;
//   latitude: number;
//   longitude: number;
//   city: string;
//   country: string;
//   usage?: string;
//   risk?: number;
// }
// /** 1 day */
// const maxAge = 24 * 60 * 60 * 1000
// async function _saveIpLocSum (ipLocSum: IpLocation) {
//   if (ipLocSum.risk === undefined) {
//     delete ipLocSum.risk
//   }
//   if (ipLocSum.usage === undefined) {
//     delete ipLocSum.usage
//   }
//   await ipCollection.findOneAndUpdate(
//     { ip: ipLocSum.ip },
//     { $set: { ...ipLocSum, mtime: Date.now() } },
//     { upsert: true }
//   )
// }
// /** 具有 save 功能 */
// async function getIpLocation (ip: string, latest = false, waitForSave = false): Promise<IpLocation> {
//   if (!latest) {
//     const recorded = await ipCollection.findOne({ ip }, { _id: 0 })
//     if (recorded !== null) {
//       if (recorded.mtime + maxAge > Date.now()) {
//         // @ts-ignore
//         return recorded
//       }
//     }
//   }
//   const fullIpLoc = await _ipLocation(ip) as FullIpLocation
//   const { longitude, latitude, city, country } = fullIpLoc
//   const summary = { ip, longitude, latitude, city, country: country.name }
//   waitForSave ? await _saveIpLocSum(summary) : _saveIpLocSum(summary)
//   return summary as IpLocation
// }
// async function reportIp (ip: string, usage?: string) {
//   const ipLoc = await getIpLocation(ip, true, true)
//   ipLoc.risk = (ipLoc.risk || 0) + 1
//   if (usage !== undefined) {
//     ipLoc.usage = usage
//   }
//   await _saveIpLocSum(ipLoc)
// }
// const ipManager = {
//   reportIp,
//   getIpLocation,
// }
// export default ipManager
