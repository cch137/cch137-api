import fs from 'fs';
import path from 'path';

const lsList = fs.readdirSync(path.resolve(__dirname + '../../../data/ls/dirs/'));

// (() => {
//   const id = 'wb6H7eglKyiTuQ';
//   console.log(id);
// })();

export default {
  list: lsList,
  get(filename: string) {
    if (filename.includes('./') || filename.includes('.\\')) {
      throw 'cannot read directory'
    }
    if (lsList.includes(filename)) {
      return JSON.parse(
        fs.readFileSync(path.resolve(__dirname + `../../../data/ls/dirs/${filename}`), 'utf8')
      )
    } else {
      for (const lsFilename of lsList) {
        if (lsFilename.includes(filename)) {
          return JSON.parse(
            fs.readFileSync(path.resolve(__dirname + `../../../data/ls/dirs/${lsFilename}`), 'utf8')
          )          
        }
      }
    }
  }
}