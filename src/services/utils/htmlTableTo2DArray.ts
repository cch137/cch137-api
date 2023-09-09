import { load } from 'cheerio'

function htmlTableTo2DArray(html: string) {
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

export default htmlTableTo2DArray;