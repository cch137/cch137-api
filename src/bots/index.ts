import ch4 from "./ch4.js";
import curva from "./curva.js";
import player from "./player.js";
import jordon from "./jordon.js";

export { ch4, curva, player, jordon };
export const bots = Object.freeze([ch4, curva, player, jordon]);

export const getBotByName = (name: string) => {
  switch (name.trim().toLowerCase()) {
    case "ch4":
      return ch4;
    case "curva":
      return curva;
    case "player":
      return player;
    case "jordon":
      return jordon;
  }
};

export const run = () => {
  if (Number(process.env.DONT_RUN_BOTS)) return [];
  const bots: Promise<void>[] = [];
  if (!Number(process.env.DONT_RUN_CH4)) bots.push(ch4.connect());
  if (!Number(process.env.DONT_RUN_CURVA)) bots.push(curva.connect());
  if (!Number(process.env.DONT_RUN_PLAYER)) bots.push(player.connect());
  if (!Number(process.env.DONT_RUN_JORDON)) bots.push(jordon.connect());
  return Promise.all(bots);
};
