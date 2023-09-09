import axios from "axios";

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76';

async function getCourseDetail(courseId: string | number) {
  const res = await axios.get(
    `https://cis.ncu.edu.tw/Course/main/support/courseDetail.html?crs=${courseId}`,
    {
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'zh-TW,zh;q=0.9',
      }
    }
  );
  return res.data
}

export {
  getCourseDetail,
}