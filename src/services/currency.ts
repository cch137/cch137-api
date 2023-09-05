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

let isFetching = false;
let lastFetched = 0
let cacheTable: string[][] | undefined

async function fetchCurrency() {
  try {
    isFetching = true
    const res = await axios.get(url)
    const table = parseTableTo2DArray(res.data).slice(1).map(r => r.slice(1, 4))
    cacheTable = table
    lastFetched = Date.now()
  } finally {
    isFetching = false
  }
}

async function getCurrencyTable() {
  if (lastFetched + 5 * 60000 < Date.now()) {
    if (cacheTable === undefined) {
      await fetchCurrency()
    } else {
      fetchCurrency()
    }
  }
  return cacheTable as string[][]
}

async function convertCurrency(fromCurrency: string, toCurrency: string): Promise<number> {
  const table = await getCurrencyTable()
  for (const row of table) {
    if (row[0] === fromCurrency && row[1] === toCurrency) {
      return +row[2]
    }
  }
  return 0
}

async function init() {
  await getCurrencyTable()
  console.log('Currency table inited.')
  return
}

export {
  init,
  convertCurrency,
}