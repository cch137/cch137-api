import ch4, { run as ch4Run } from "./ch4";
import curva, { run as curvaRun } from "./curva";
import player, { run as playerRun } from "./player";
import { config as dotenv } from "dotenv";

export { ch4, curva, player };

export const run = () => {
  dotenv();
  if (Number(process.env.DONT_RUN_BOTS)) return [];
  const bots: Promise<void>[] = [];
  if (!Number(process.env.DONT_RUN_CH4)) bots.push(ch4Run());
  if (!Number(process.env.DONT_RUN_CURVA)) bots.push(curvaRun());
  if (!Number(process.env.DONT_RUN_PLAYER)) bots.push(playerRun());
  return Promise.all(bots);
};
