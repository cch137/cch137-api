import ch4 from "./ch4";
import curva from "./curva";
import player from "./player";
import { config as dotenv } from "dotenv";
import type { BotClient } from "./utils";

export { ch4, curva, player };
export const bots = Object.freeze([ch4, curva, player]);

export const getBotByName = (name: string) => {
  switch (name.trim().toLowerCase()) {
    case "ch4":
      return ch4;
    case "curva":
      return curva;
    case "player":
      return player;
  }
};

export const run = () => {
  dotenv();
  if (Number(process.env.DONT_RUN_BOTS)) return [];
  const bots: Promise<BotClient>[] = [];
  if (!Number(process.env.DONT_RUN_CH4)) bots.push(ch4.connect());
  if (!Number(process.env.DONT_RUN_CURVA)) bots.push(curva.connect());
  if (!Number(process.env.DONT_RUN_PLAYER)) bots.push(player.connect());
  return Promise.all(bots);
};
