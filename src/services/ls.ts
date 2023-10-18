import fs from 'fs';
import path from 'path';

const lsList = fs.readdirSync(path.resolve(__dirname + '../../../data/ls'));

export default {
  list: lsList,
  get(filename: string) {
    if (filename.includes('./') || filename.includes('.\\')) {
      throw 'cannot read directory'
    }
    return fs.readFileSync(path.resolve(__dirname + `../../../data/ls/${filename}`), 'utf8').toString();
  }
}