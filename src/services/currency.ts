import axios from 'axios'
import { load } from 'cheerio'

const url = 'https://docs.google.com/spreadsheets/d/1VjdmK8-PBoOt6sRCvZ40G5qmYyxpLzHl5RCSQWejxYk/preview/sheet?gid=1360697588'

function parseTableTo2DArray(html: string) {
  const $ = load(html);
  const table = $('table'); // 選擇HTML中的表格元素

  const result: string[][] = [];

  // 遍歷每一個表格行（tr）
  table.find('tr').each((rowIndex, rowElement) => {
    const row: string[] = [];
    
    // 遍歷行中的每一個單元格（td或th）
    $(rowElement).find('td, th').each((cellIndex, cellElement) => {
      row.push($(cellElement).text().trim()); // 將單元格文本添加到行中
    });

    result.push(row); // 添加行到結果中
  });

  return result;
}

let lastFetched = 0
const currenctList = new Set<string>()
const currencyMap = new Map<string,number>()

async function fetchCurrencies() {
  const res = await axios.get(url)
  // SLICE 2 是因為第一行是空的，第二行是 "From"（table head）
  const table = parseTableTo2DArray(res.data).slice(1).map(r => r.slice(1, 4))
  currencyMap.clear()
  for (const row of table) {
    const key = `${row[0]}${row[1]}`
    if (key) {
      currencyMap.set(key, +row[2])
      currenctList.add(row[0])
    }
  }
  lastFetched = Date.now()
}

async function getCurrencyMap() {
  if (lastFetched + 5 * 60000 < Date.now()) {
    if (currencyMap.size === 0) {
      await fetchCurrencies()
    } else {
      fetchCurrencies()
    }
  }
  return currencyMap
}

async function convertCurrency(fromCurrency: string, toCurrency: string): Promise<number> {
  return (await getCurrencyMap()).get(`${fromCurrency}${toCurrency}`) || 0
}

async function init() {
  await getCurrencyMap()
  console.log('Currency table inited.')
  return
}

async function getCurrencyList() {
  return [...currenctList]
}

export {
  init,
  convertCurrency,
  getCurrencyList,
}