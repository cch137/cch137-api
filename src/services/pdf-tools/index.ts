import fs from 'fs';
import path from 'path';
import { checkCachesFolder } from './utils';
import pdfToImg from './pdf-to-img';

const cachesFolderPath = path.join(__dirname, '../../../caches/');

checkCachesFolder(true);

export default {
  pdfToImg,
  pngToPdf() {},
}
