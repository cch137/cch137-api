import ch4, { run as ch4Run } from "./ch4";
import curva, { run as curvaRun } from "./curva";

export { ch4, curva };

export const run = () => {
  const bots: Promise<void>[] = [];
  bots.push(ch4Run());
  // bots.push(curvaRun());
  return Promise.all(bots);
};
