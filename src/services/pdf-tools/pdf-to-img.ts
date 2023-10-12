import pdf2image from 'pdf2image';
import { cachesFolderPath } from './utils';

cachesFolderPath

const convertOptions = {
  outputFormat: 'jpeg',
  density: 150,
  quality: 100,
};

async function pdfToImg () {
  const result = await pdf2image.convertPDF(cachesFolderPath, {
    outputType: 'png',
    density: 150,
    quality: 100,
  });
}

export default pdfToImg;
