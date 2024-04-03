import { readString } from "@cch137/utils/stream";
import { load } from "cheerio";

const extractEarthquakeData = (input: string) => {
  const regex =
    /(\d{2}\/\d{2} \d{2}:\d{2})NEW 看更多 地點(.+?) 深度(.+?) 地震規模(.+?)/;
  const match = input.match(regex);
  if (!match) return null;
  return {
    時間: match[1],
    地點: match[2],
    深度: match[3],
    地震規模: match[4],
  };
};

export const 交通部中央氣象署最近地震 = async () => {
  const res = await fetch(
    "https://www.cwa.gov.tw/V8/C/E/MOD/EQ_ROW.html?T=2024040312-3"
  );
  const $ = load(`<table>${await readString(res.body)}</table>`);
  const table = $([...$("table")][0]);
  const items = [
    ...table.children("thead").children("tr"),
    ...table.children("tbody").children("tr"),
    ...table.children("tfoot").children("tr"),
    ...table.children("tr"),
  ]
    .map((tr) => {
      const row = $(tr);
      const cells = [...row.children("th"), ...row.children("td")].map((c) =>
        $(c).text().replace(/\s+/g, " ").trim()
      );
      return {
        編號: cells[0],
        震度: cells[1],
        ...extractEarthquakeData(cells[2]),
      };
    })
    .filter(({ 編號 }) => !isNaN(+編號))
    .sort((a, b) => +b.編號 - +a.編號);
  return items;
};

export default 交通部中央氣象署最近地震;
