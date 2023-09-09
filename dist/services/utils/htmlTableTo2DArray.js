"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
function htmlTableTo2DArray(html) {
    const $ = (0, cheerio_1.load)(html);
    const table = $('table'); // 選擇HTML中的表格元素
    const result = [];
    // 遍歷每一個表格行（tr）
    table.find('tr').each((rowIndex, rowElement) => {
        const row = [];
        // 遍歷行中的每一個單元格（td或th）
        $(rowElement).find('td, th').each((cellIndex, cellElement) => {
            row.push($(cellElement).text().trim()); // 將單元格文本添加到行中
        });
        result.push(row); // 添加行到結果中
    });
    return result;
}
exports.default = htmlTableTo2DArray;
