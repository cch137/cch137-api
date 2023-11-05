import axios from "axios"
import qs from "qs"

async function preview(url: string) {
  const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`
  const resourceUrl = (await axios.get(metadataUrl)).data.href as string;
  const { content_type: type, filename } = qs.parse(resourceUrl.split('?').at(-1) as string);
  const res = (await axios.get(resourceUrl, { responseType: 'stream' }));
  return {
    res,
    data: res.data,
    type: type || res.headers['content-type'] || res.headers['Content-Type'],
    filename
  }
}

export default {
  preview
}