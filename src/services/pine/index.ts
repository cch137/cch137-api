import axios from 'axios';
import fs from 'fs';
import path from 'path';
import he from 'he';
import htmlTableTo2DArray, { ParsedTable } from '../utils/htmlTableTo2DArray';
import PineCourse from '../mongoose/models/PineCourse';

// const SignOpenForData = JSON.parse(fs.readFileSync(path.resolve(__dirname + '../../../../data/SignOpenForData.json'), 'utf8'));

// for (const key of Object.keys(SignOpenForData)) {
//   const item = SignOpenForData[key];
//   if (key.startsWith('cofuZdept')) {
//     delete SignOpenForData[key];
//   }
//   if ('text' in item) {
//     item.text = he.decode(item.text)
//   }
// }
// console.log(SignOpenForData);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76';

const origin = ['ci', 's.', 'nc', 'u.', 'ed', 'u.', 'tw'].join('-').replace(/-/g, '');
const pathname = ['/Cour', 'se/ma', 'in/su', 'pport', '/cour', 'seDet', 'ail.h', 'tml?c', 'rs='].join('-').replace(/-/g, '');

function toCourseId(id: number | string): string {
  return (+((id as undefined | string | number) || 0)).toString().padStart(5, '0');
}

const courseAge = 86_400_000;
const courseSerialNumberKey = '\u6D41\u6C34\u865F / \u8AB2\u865F';

type CourseDetail = Record<string,number|string|string[][]>

const courseFetching = new Map<string, Promise<CourseDetail>>();

async function _fetchCourseDetail(id: string | number) {
  id = toCourseId(id);
  if (!courseFetching.has(id)) {
    courseFetching.set(id, (async () => {
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
      const courseDetail: CourseDetail = { mtime: Date.now() }
      const namelist = [(data.pop() as ParsedTable).flat() as string[], (data.pop() as string[])[0]].reverse();
      const conditions = [(data.pop() as ParsedTable).flat() as string[], (data.pop() as string[])[0]].reverse();
      const competencies = [(data.pop() as ParsedTable).flat(3) as string[], (data.pop() as string[])[0]].reverse();
      for (const item of [...data, competencies, conditions, namelist]) {
        const [key, value] = item as [string, string | string[][]];
        courseDetail[key] = value;
      }
      const courseSerialNumber = courseDetail[courseSerialNumberKey] as string;
      const courseIsExists = !(!courseSerialNumber || courseSerialNumber.toString().startsWith('/'));
      if (courseIsExists) {
        await PineCourse.deleteMany({ [courseSerialNumberKey]: courseSerialNumber });
        await PineCourse.create(courseDetail);
        console.log(`Saved course: ${courseSerialNumber}`);
      }
      return courseDetail;
    })())
  }
  return await courseFetching.get(id) as CourseDetail;
}

async function getCourseDetail(id: string | number) {
  id = toCourseId(id);
  const courseDetailFromDatabase = await PineCourse.findOne(
    { [courseSerialNumberKey]: { $regex: new RegExp(`^${id}`) } },
    { _id: 0 }
  );
  return courseDetailFromDatabase && (courseDetailFromDatabase!.mtime || 0) + courseAge > Date.now()
    ? courseDetailFromDatabase
    : await _fetchCourseDetail(id);
}

export {
  courseSerialNumberKey,
  toCourseId,
  getCourseDetail,
}