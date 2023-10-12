import fs from 'fs';
import path from 'path';

const cachesFolderPath = path.join(__dirname, '../../../caches/');

function checkCachesFolder(init = false) {
  if (fs.existsSync(cachesFolderPath)) {
    if (fs.statSync(cachesFolderPath).isDirectory()){
      if (init) {
        fs.rmSync(cachesFolderPath, { recursive: true })
      } else {
        return true;
      }
    }
  }
  fs.mkdirSync(cachesFolderPath);
  return true;
}

export {
  cachesFolderPath,
  checkCachesFolder,
}
