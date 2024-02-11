import ch4, {run as ch4Run} from "./ch4";
import curva, {run as curva4Run} from "./curva";

export {
  ch4,
  curva,
};

export const run = () => [ch4Run(), curva4Run()];
