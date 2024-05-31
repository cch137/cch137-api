import { askCh4Ai } from "../../bots/curva";

const extractImages = (html: string) => {
  const images = [];
  const regex = /<img class="charImg" src="([^"]+)".*?<p>(.*?)<\/p>/gs;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = `http://ccamc.org/${match[1]}`;
    const name = match[2]
      .replace(/<\/?br \/>/g, " ")
      .replace(/\s+/, " ")
      .trim();
    images.push({ src, name });
  }
  return images;
};

export const getCharImages = async (q: string) => {
  const res0 = await fetch(
    `http://ccamc.org/cjkv_oaccgd.php?cjkv=${q}&type=oracle`
  );
  const html = await res0.text();
  const zlist = /<div class="zlist".*?>(.*?)<\/div>/s.exec(html)![1];
  const a = encodeURIComponent(
    (/<span class="a">([^<]+)<\/span>/g.exec(zlist) || [])[1] || ""
  );
  const t = encodeURIComponent(
    (/<span class="t">([^<]+)<\/span>/g.exec(zlist) || [])[1] || ""
  );
  const i = encodeURIComponent(
    (/<span class="i">([^<]+)<\/span>/g.exec(zlist) || [])[1] || ""
  );
  const res1 = await fetch(
    "http://ccamc.org/components/CJKV/get_ziyuan_images_aw.php",
    {
      method: "POST",
      body: `a=${a}&t=${t}&i=${i}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  return await Promise.all(
    extractImages(await res1.text()).map(async ({ src, name }) => {
      const svg = await (await fetch(src)).text();
      return { svg, name };
    })
  );
};

export const getInfer = async (q: string) => {
  let i = 3;
  while (i-- > 0) {
    try {
      return await new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout")), 30000);
        try {
          const prompt = `你是一名文字學助手，使用者正在辨認甲骨文，使用者須要根據字形辨識甲骨文對應的古文字。
此甲骨文的描述是: ${q}
描述可能關於字形的描述或者字形的領域，描述不是需要辨認的甲骨文，只是用於推敲的資訊，因此不要直接列出描述裡含有的字。
你須要根據說文解字、古文字演化規則與邏輯，推測這個甲骨文可能的字形。
請只以 JSON 格式列出可能的字形作為回复。response: string[]
`;
          const res = await askCh4Ai(
            [{ role: "user", text: prompt }],
            "gpt-3.5-turbo"
          );
          await res.process;
          const answer = res.chunks.join("");
          resolve(
            JSON.parse(
              answer.substring(answer.indexOf("["), answer.lastIndexOf("]") + 1)
            )
          );
          clearTimeout(timeout);
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {}
  }
  throw new Error("Tried too many times");
};

export const ccamc = {
  getCharImages,
  getInfer,
};

export default ccamc;
