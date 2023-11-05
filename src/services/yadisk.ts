import axios from "axios"

async function preview(url: string) {
  const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`
  const resourceUrl = (await axios.get(metadataUrl)).data.href;
  const res = (await axios.get(resourceUrl, { responseType: 'stream' }));
  return {
    res,
    data: res.data,
    type: res.headers['content-type'] || res.headers['Content-Type'],
  }
}

export default {
  preview
}