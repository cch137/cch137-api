import { load as cheerioLoad } from "cheerio";
import { cheerioToTextNodes, type TextNode } from "../../utils/cheerio";
import googleTranslate from "../google-translate";

type TemperatureUnit =
  | "c"
  | "C"
  | "celsius"
  | "Celsius"
  | "f"
  | "F"
  | "fahrenheit"
  | "Fahrenheit";

type WeatherInfo = {
  temperature: string;
  weather: string;
  time: string;
  location: string;
  source: string;
};

const DEFAULT_TEMP_UNIT: TemperatureUnit = "Celsius";

const normalizeTemperatureUnit = (unit?: string) => {
  if (typeof unit !== "string") {
    return DEFAULT_TEMP_UNIT;
  }
  switch (unit.trim().at(0)) {
    case "f":
    case "F":
      return "Fahrenheit";
    case "c":
    case "C":
    default:
      return "Celsius";
  }
};

const getTemperatureMetadata = (_unit?: string) => {
  const unit = normalizeTemperatureUnit(_unit);
  const isCelsius = unit.at(0)!.toUpperCase() !== "F";
  const regexp = isCelsius
    ? new RegExp(/^[0-9]+\s*°C$/)
    : new RegExp(/^[0-9]+\s*°F$/);
  return Object.freeze({ unit, regexp });
};

type FetchWeatherOptions = { unit?: TemperatureUnit; lang?: string };

async function fetchWeather(
  city: string,
  unit?: TemperatureUnit
): Promise<WeatherInfo>;
async function fetchWeather(
  city: string,
  options?: FetchWeatherOptions
): Promise<WeatherInfo>;
async function fetchWeather(
  city: string,
  options?: TemperatureUnit | FetchWeatherOptions
): Promise<WeatherInfo>;
async function fetchWeather(
  city: string,
  options?: TemperatureUnit | FetchWeatherOptions
): Promise<WeatherInfo> {
  if (typeof options === "string")
    return await fetchWeather(city, { unit: options });
  if (!options) return await fetchWeather(city, {});

  city = city.replace(/\s+/g, " ").trim();

  const { unit: _unit, lang } = options;
  const { unit, regexp } = getTemperatureMetadata(_unit);
  const query = `${city} weather (temperature unit: ${unit})`;
  const res = await fetch(`https://www.google.com/search?q=${query}`);
  const content = new TextDecoder("iso-8859-1").decode(await res.arrayBuffer());

  const $ = cheerioLoad(content);
  $("link,meta,style,script,noscript,img,video,audio,canvas,svg").remove();
  const nodeTree = cheerioToTextNodes($("body"), $);

  const findWeatherData = (
    node: TextNode,
    indexes: number[] = [],
    res?: string
  ): string[] | string | undefined => {
    if (!Array.isArray(node)) return undefined;
    const [n0, n1, n2] = node;
    if (typeof n0 === "string" && n0.match(regexp)) {
      if (typeof n1 === "string" && typeof n2 === "string") {
        let locationNode: TextNode = nodeTree;
        const _indexes = indexes.slice(0, indexes.length - 1);
        for (const x of _indexes) locationNode = locationNode[x];
        const lc = locationNode[0][0];
        if (typeof lc === "string") return [n0, n1, n2, lc];
        return [n0, n1, n2];
      }
      res ||= n0;
    }
    const { length } = node;
    for (let i = 0; i < length; i++) {
      const matched = findWeatherData(node[i], [...indexes, i], res);
      if (Array.isArray(matched)) return matched;
      if (matched) res ||= matched;
    }
    return res;
  };

  const matched = findWeatherData(nodeTree);
  const [_temperature = "", _w = "-", _source = "-", location = "-"] =
    Array.isArray(matched) ? matched : [matched];
  const _weatherDetails = _w.split("\n").map((i) => i.trim());

  const result = {
    temperature: _temperature.replace(/\s*/g, "") || "no info",
    weather: (_weatherDetails.at(-1) as string) || "-",
    time: (_weatherDetails.at(-2) as string) || "-",
    location,
    source: (_source.match(/\S+\.\S+/) || []).at(0) || _source,
  };

  if (lang) {
    try {
      const translated = await googleTranslate(
        [result.weather, result.time, result.location].join("\n\n---\n\n"),
        { to: lang }
      );
      const [weather, time, loc] = translated.text
        .split(/\s---\s/)
        .map((i) => i.trim());
      if (weather) result.weather = weather;
      if (time) result.time = time;
      if (loc) result.location = loc;
    } catch {}
  }

  return result;
}

async function fetchWeatherText(
  city: string,
  unit?: TemperatureUnit
): Promise<string>;
async function fetchWeatherText(
  city: string,
  options?: FetchWeatherOptions
): Promise<string>;
async function fetchWeatherText(
  city: string,
  options?: TemperatureUnit | FetchWeatherOptions
): Promise<string>;
async function fetchWeatherText(
  city: string,
  options?: TemperatureUnit | FetchWeatherOptions
): Promise<string> {
  const { temperature, weather, time, location, source } = await fetchWeather(
    city,
    options
  );
  return [temperature, weather, time, location, source]
    .map((i) => i.replace(/\n+/g, " "))
    .join("\n");
}

export { fetchWeather, fetchWeatherText };

export default fetchWeather;
