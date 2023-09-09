import axios from "axios";
import htmlTableTo2DArray, { ParsedTable } from "./utils/htmlTableTo2DArray";

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76';

const origin = ['ci', 's.', 'nc', 'u.', 'ed', 'u.', 'tw'].join('-').replace(/-/g, '');
const pathname = ['/Cour', 'se/ma', 'in/su', 'pport', '/cour', 'seDet', 'ail.h', 'tml?c', 'rs='].join('-').replace(/-/g, '');

async function getCourseDetail(id: string | number) {
  const res = (await axios.get(
    `https://${origin}${pathname}${id}`,
    {
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'zh-TW,zh;q=0.9',
      }
    }
  )).data;
  const data = htmlTableTo2DArray(res)
  const parsedData: Record<string,string|string[][]> = {}
  const namelist = [(data.pop() as ParsedTable).flat() as string[], (data.pop() as string[])[0]].reverse()
  const conditions = [(data.pop() as ParsedTable).flat() as string[], (data.pop() as string[])[0]].reverse()
  const competencies = [(data.pop() as ParsedTable).flat(3) as string[], (data.pop() as string[])[0]].reverse()
  for (const item of [...data, competencies, conditions, namelist]) {
    const [key, value] = item as [string, string | string[][]];
    parsedData[key] = value
  }
  return parsedData;
}

export {
  getCourseDetail,
}