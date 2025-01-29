/** Import the `load` function from the `cheerio` library for parsing HTML */
import { load } from "cheerio";

/** Import and configure environment variables using `dotenv` */
import { config as env } from "dotenv";

env();

/**
 * Type representing the full response from the OpenWeatherMap API.
 */
type OpenWeatherFullResponse = {
  coord: {
    /** Longitude in degrees */
    lon: number;
    /** Latitude in degrees */
    lat: number;
  };
  weather: {
    /** Weather condition ID */
    id: number;
    /** Group of weather parameters (Rain, Snow, Extreme, etc.) */
    main: string;
    /** Weather condition within the group */
    description: string;
    /** Weather icon ID */
    icon: string;
  }[];
  /** Internal parameter */
  base: string;
  main: {
    /** Current temperature in Celsius */
    temp: number;
    /** Human perception of weather temperature in Celsius */
    feels_like: number;
    /** Minimum temperature at the moment in Celsius */
    temp_min: number;
    /** Maximum temperature at the moment in Celsius */
    temp_max: number;
    /** Atmospheric pressure in hPa */
    pressure: number;
    /** Humidity percentage */
    humidity: number;
    /** Sea level pressure in hPa (optional) */
    sea_level?: number;
    /** Ground level pressure in hPa (optional) */
    grnd_level?: number;
  };
  /** Visibility in meters */
  visibility: number;
  wind: {
    /** Wind speed in meters per second */
    speed: number;
    /** Wind direction in degrees */
    deg: number;
  };
  clouds: {
    /** Cloudiness percentage */
    all: number;
  };
  /** Time of data calculation, unix, UTC */
  dt: number;
  sys: {
    /** Internal parameter */
    type: number;
    /** Internal parameter */
    id: number;
    /** Country code (e.g., "TW" for Taiwan) */
    country: string;
    /** Sunrise time, unix, UTC */
    sunrise: number;
    /** Sunset time, unix, UTC */
    sunset: number;
  };
  /** Shift in seconds from UTC */
  timezone: number;
  /** City ID */
  id: number;
  /** City name */
  name: string;
  /** Internal parameter */
  cod: number;
};

/**
 * Type representing a summarized version of the OpenWeatherMap API response.
 */
type OpenWeatherSummary = {
  /** Name of the location */
  location: string;
  temperature: {
    /** Current temperature in Celsius */
    current: number;
    /** Apparent temperature in Celsius */
    apparent: number;
    /** Minimum temperature in Celsius */
    min: number;
    /** Maximum temperature in Celsius */
    max: number;
  };
  weather: {
    /** Weather condition ID */
    id: number;
    /** Main weather condition */
    main: string;
    /** Detailed weather description */
    description: string;
    /** Weather icon ID */
    icon: string;
  };
  wind: {
    /** Wind speed in meters per second */
    speed: number;
    /** Wind direction in degrees */
    direction: number;
  };
  /** Cloudiness percentage */
  clouds: number;
  /** Humidity percentage */
  humidity: number;
};

/**
 * Type representing a summarized weather data for a 3-hour interval from the Central Weather Administration (CWA).
 */
type CWAWeatherSummary3Hour = {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Time in HH:MM format */
  time: string;
  /** Combined date and time */
  dateTime: string;
  /** Weekday name (e.g., "Monday") */
  weekDay: string;
  /** Weather condition description */
  weather: string;
  /** Temperature in Celsius */
  temperatureC: number;
  /** Temperature in Fahrenheit */
  temperatureF: number;
  /** Apparent temperature in Celsius */
  apparentTemperatureC: number;
  /** Apparent temperature in Fahrenheit */
  apparentTemperatureF: number;
  /** Precipitation probability */
  precipitation: string;
  /** Humidity percentage */
  humidity: string;
  wind: {
    /** Beaufort scale description */
    beaufort: string;
    /** Wind speed in meters per second */
    speed: string;
    /** Wind direction as compass direction */
    direction: string;
  };
  /** Comfort level description */
  feelLike: string;
};

type WeatherSummary = {
  cwa3Hours: CWAWeatherSummary3Hour[];
  openWeather: OpenWeatherSummary | null;
};

/**
 * Asynchronously parses the weather table from the CWA website and returns summarized weather data.
 */
async function getWeathersFromCWA() {
  /** Fetch the weather data page from the CWA website */
  const res = await fetch(
    "https://www.cwa.gov.tw/V8/C/W/Town/MOD/3hr/6800200_3hr_PC.html"
  );

  /** Load the fetched HTML content into Cheerio for parsing */
  const $ = load(
    `<html><body><table>${await res.text()}</table></body></html>`
  );

  /**
   * Extract table rows (`<tr>`) and process each row to handle column spans.
   */
  const elementTable = $("tr")
    .toArray()
    .map((tr) => {
      return $(tr)
        .find("th")
        .toArray()
        .concat($(tr).find("td").toArray())
        .map((td) => {
          /** Get the colspan attribute, defaulting to 1 if not present */
          const colSpan = Number($(td).attr("colspan") || 1);
          /**
           * If colspan is 1, return the table cell as is.
           * Otherwise, create an array with duplicated table cells based on colspan.
           */
          return colSpan == 1
            ? td
            : Array.from({ length: colSpan }).map((_, i) => td);
        })
        .flat();
    });

  /** Initialize an object to store parsed data with keys as strings and values as arrays of strings */
  const data: { [key: string]: string[] } = {};

  /** Iterate over each processed table row to extract relevant data */
  elementTable.forEach((row) => {
    /** Extract the header cell text to determine the type of data in the row */
    const attr = $(row.shift()).text();

    switch (attr) {
      case "日期": {
        // "Date" in Chinese
        /** Initialize arrays to store dates and weekdays */
        const dateArray: string[] = (data["date"] = []);
        const weekDayArray: string[] = (data["weekDay"] = []);
        row.forEach((item) => {
          /** Push the date text into the dateArray */
          dateArray.push($(item.childNodes[0]).text());
          /** Push the weekday text into the weekDayArray */
          weekDayArray.push($(item.childNodes[2]).text());
        });
        break;
      }
      case "時間": {
        // "Time" in Chinese
        /** Map each table cell text to the time array */
        data["time"] = row.map((item) => $(item).text());
        break;
      }
      case "天氣狀況": {
        // "Weather Condition" in Chinese
        /** Map each table cell's title attribute to the weather array */
        data["weather"] = row.map(
          (item) => $(item.childNodes[0]).attr("title") || ""
        );
        break;
      }
      case "溫度": {
        // "Temperature" in Chinese
        /** Initialize arrays to store temperature in Celsius and Fahrenheit */
        const temperatureCArray: string[] = (data["temperatureC"] = []);
        const temperatureFArray: string[] = (data["temperatureF"] = []);
        row.forEach((item) => {
          /** Push Celsius temperature into temperatureCArray */
          temperatureCArray.push($(item.childNodes[0]).text());
          /** Push Fahrenheit temperature into temperatureFArray */
          temperatureFArray.push($(item.childNodes[1]).text());
        });
        break;
      }
      case "體感溫度": {
        // "Apparent Temperature" in Chinese
        /** Initialize arrays to store apparent temperature in Celsius and Fahrenheit */
        const temperatureCArray: string[] = (data["apparentTemperatureC"] = []);
        const temperatureFArray: string[] = (data["apparentTemperatureF"] = []);
        row.forEach((item) => {
          /** Push apparent Celsius temperature into temperatureCArray */
          temperatureCArray.push($(item.childNodes[0]).text());
          /** Push apparent Fahrenheit temperature into temperatureFArray */
          temperatureFArray.push($(item.childNodes[1]).text());
        });
        break;
      }
      case "降雨機率": {
        // "Precipitation Probability" in Chinese
        /** Map each table cell text to the precipitation array */
        data["precipitation"] = row.map((item) => $(item).text());
        break;
      }
      case "相對濕度": {
        // "Relative Humidity" in Chinese
        /** Map each table cell text to the humidity array */
        data["humidity"] = row.map((item) => $(item).text());
        break;
      }
      case "蒲福風級": {
        // "Beaufort Wind Scale" in Chinese
        /** Map each table cell text to the wind Beaufort scale array */
        data["windBeaufort"] = row.map((item) => $(item).text());
        break;
      }
      case "風速(m/s)": {
        // "Wind Speed (m/s)" in Chinese
        /** Map each table cell text to the wind speed array */
        data["windSpeed"] = row.map((item) => $(item).text());
        break;
      }
      case "風向": {
        // "Wind Direction" in Chinese
        /** Map each table cell text to the wind direction array */
        data["windDirection"] = row.map((item) => $(item).text());
        break;
      }
      case "舒適度": {
        // "Comfort Level" in Chinese
        /** Map each table cell text to the comfort level array */
        data["feelLike"] = row.map((item) => $(item).text());
        break;
      }
    }
  });

  /**
   * Create an array of summarized weather data for each 3-hour interval.
   *
   * @returns An array of `CWAWeatherSummary3Hour` objects containing summarized weather information.
   */
  const weatherData: CWAWeatherSummary3Hour[] = data["date"].map((date, i) => ({
    date,
    time: data["time"][i],
    dateTime: `${date} ${data["time"][i]}`,
    weekDay: data["weekDay"][i],
    weather: data["weather"][i],
    temperatureC: Number(data["temperatureC"][i]),
    temperatureF: Number(data["temperatureF"][i]),
    apparentTemperatureC: Number(data["apparentTemperatureC"][i]),
    apparentTemperatureF: Number(data["apparentTemperatureF"][i]),
    precipitation: data["precipitation"][i],
    humidity: data["humidity"][i],
    wind: {
      beaufort: data["windBeaufort"][i],
      speed: data["windSpeed"][i],
      direction: data["windDirection"][i],
    },
    feelLike: data["feelLike"][i],
  }));

  /** Return the summarized weather data */
  return weatherData;
}

/**
 * Set a timeout to fetch current weather data from OpenWeatherMap API after the initial parsing.
 * This ensures that the parsing completes before making the API request.
 */
export async function fetchWeatherFromOpenWeather(
  {
    lat,
    lon,
  }: {
    lat: number;
    lon: number;
  } = {
    lat: 24.9683,
    lon: 121.1922,
  }
) {
  /** OpenWeatherMap API key from environment variables */
  const openWeatherKey = process.env.API_KEY_OPEN_WEATHER;

  /** Construct the OpenWeatherMap API URL with query parameters */
  const url = `https://api.openweathermap.org/data/2.5/weather?appid=${openWeatherKey}&lat=${lat}&lon=${lon}&units=metric`;

  /** Fetch the current weather data from OpenWeatherMap */
  const res = (await (await fetch(url)).json()) as OpenWeatherFullResponse;

  /** Construct the summary from the full response */
  const summary: OpenWeatherSummary = {
    location: res.name,
    temperature: {
      current: res.main.temp,
      apparent: res.main.feels_like,
      min: res.main.temp_min,
      max: res.main.temp_max,
    },
    weather: {
      id: res.weather[0].id,
      main: res.weather[0].main,
      description: res.weather[0].description,
      icon: res.weather[0].icon,
    },
    wind: {
      speed: res.wind.speed,
      direction: res.wind.deg,
    },
    clouds: res.clouds.all,
    humidity: res.main.humidity,
  };

  return summary;
}

// sample: {"cwa3Hours":[{"date":"10/15","time":"15:00","dateTime":"10/15 15:00","weekDay":"星期二","weather":"晴","temperatureC":31,"temperatureF":88,"apparentTemperatureC":34,"apparentTemperatureF":93,"precipitation":"10%","humidity":"59%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"悶熱"},{"date":"10/15","time":"18:00","dateTime":"10/15 18:00","weekDay":"星期二","weather":"多雲","temperatureC":27,"temperatureF":81,"apparentTemperatureC":30,"apparentTemperatureF":86,"precipitation":"0%","humidity":"77%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/15","time":"21:00","dateTime":"10/15 21:00","weekDay":"星期二","weather":"多雲","temperatureC":26,"temperatureF":79,"apparentTemperatureC":29,"apparentTemperatureF":84,"precipitation":"0%","humidity":"83%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"00:00","dateTime":"10/16 00:00","weekDay":"星期三","weather":"多雲","temperatureC":25,"temperatureF":77,"apparentTemperatureC":28,"apparentTemperatureF":82,"precipitation":"20%","humidity":"84%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"03:00","dateTime":"10/16 03:00","weekDay":"星期三","weather":"多雲","temperatureC":25,"temperatureF":77,"apparentTemperatureC":27,"apparentTemperatureF":81,"precipitation":"20%","humidity":"84%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"06:00","dateTime":"10/16 06:00","weekDay":"星期三","weather":"多雲","temperatureC":24,"temperatureF":75,"apparentTemperatureC":26,"apparentTemperatureF":79,"precipitation":"20%","humidity":"81%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"09:00","dateTime":"10/16 09:00","weekDay":"星期三","weather":"陰","temperatureC":26,"temperatureF":79,"apparentTemperatureC":28,"apparentTemperatureF":82,"precipitation":"20%","humidity":"72%","wind":{"beaufort":"3","speed":"4","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"12:00","dateTime":"10/16 12:00","weekDay":"星期三","weather":"多雲","temperatureC":29,"temperatureF":84,"apparentTemperatureC":31,"apparentTemperatureF":88,"precipitation":"20%","humidity":"66%","wind":{"beaufort":"3","speed":"4","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"15:00","dateTime":"10/16 15:00","weekDay":"星期三","weather":"晴","temperatureC":29,"temperatureF":84,"apparentTemperatureC":31,"apparentTemperatureF":88,"precipitation":"20%","humidity":"71%","wind":{"beaufort":"3","speed":"4","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"18:00","dateTime":"10/16 18:00","weekDay":"星期三","weather":"多雲","temperatureC":26,"temperatureF":79,"apparentTemperatureC":29,"apparentTemperatureF":84,"precipitation":"20%","humidity":"83%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/16","time":"21:00","dateTime":"10/16 21:00","weekDay":"星期三","weather":"多雲","temperatureC":25,"temperatureF":77,"apparentTemperatureC":28,"apparentTemperatureF":82,"precipitation":"20%","humidity":"87%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/17","time":"00:00","dateTime":"10/17 00:00","weekDay":"星期四","weather":"晴","temperatureC":25,"temperatureF":77,"apparentTemperatureC":28,"apparentTemperatureF":82,"precipitation":"10%","humidity":"88%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/17","time":"03:00","dateTime":"10/17 03:00","weekDay":"星期四","weather":"晴","temperatureC":24,"temperatureF":75,"apparentTemperatureC":27,"apparentTemperatureF":81,"precipitation":"10%","humidity":"89%","wind":{"beaufort":"2","speed":"2","direction":"東北風"},"feelLike":"舒適"},{"date":"10/17","time":"06:00","dateTime":"10/17 06:00","weekDay":"星期四","weather":"晴","temperatureC":24,"temperatureF":75,"apparentTemperatureC":27,"apparentTemperatureF":81,"precipitation":"10%","humidity":"87%","wind":{"beaufort":"2","speed":"3","direction":"東北風"},"feelLike":"舒適"},{"date":"10/17","time":"09:00","dateTime":"10/17 09:00","weekDay":"星期四","weather":"晴","temperatureC":26,"temperatureF":79,"apparentTemperatureC":29,"apparentTemperatureF":84,"precipitation":"10%","humidity":"75%","wind":{"beaufort":"2","speed":"3","direction":"偏東風"},"feelLike":"舒適"},{"date":"10/17","time":"12:00","dateTime":"10/17 12:00","weekDay":"星期四","weather":"晴","temperatureC":29,"temperatureF":84,"apparentTemperatureC":32,"apparentTemperatureF":90,"precipitation":"10%","humidity":"61%","wind":{"beaufort":"2","speed":"3","direction":"偏東風"},"feelLike":"舒適"},{"date":"10/17","time":"15:00","dateTime":"10/17 15:00","weekDay":"星期四","weather":"晴","temperatureC":29,"temperatureF":84,"apparentTemperatureC":32,"apparentTemperatureF":90,"precipitation":"10%","humidity":"67%","wind":{"beaufort":"2","speed":"2","direction":"偏東風"},"feelLike":"舒適"},{"date":"10/17","time":"18:00","dateTime":"10/17 18:00","weekDay":"星 期四","weather":"多雲","temperatureC":27,"temperatureF":81,"apparentTemperatureC":30,"apparentTemperatureF":86,"precipitation":"0%","humidity":"81%","wind":{"beaufort":"2","speed":"3","direction":"偏東風"},"feelLike":"舒適"},{"date":"10/17","time":"21:00","dateTime":"10/17 21:00","weekDay":"星期四","weather":"晴","temperatureC":25,"temperatureF":77,"apparentTemperatureC":28,"apparentTemperatureF":82,"precipitation":"0%","humidity":"89%","wind":{"beaufort":"2","speed":"2","direction":"偏東風"},"feelLike":"舒適"},{"date":"10/18","time":"00:00","dateTime":"10/18 00:00","weekDay":"星期五","weather":"晴","temperatureC":25,"temperatureF":77,"apparentTemperatureC":29,"apparentTemperatureF":84,"precipitation":"10%","humidity":"91%","wind":{"beaufort":"2","speed":"2","direction":"偏南風"},"feelLike":"舒適"},{"date":"10/18","time":"03:00","dateTime":"10/18 03:00","weekDay":"星期五","weather":"晴","temperatureC":25,"temperatureF":77,"apparentTemperatureC":28,"apparentTemperatureF":82,"precipitation":"10%","humidity":"91%","wind":{"beaufort":"2","speed":"2","direction":"偏南風"},"feelLike":"舒適"},{"date":"10/18","time":"06:00","dateTime":"10/18 06:00","weekDay":"星期五","weather":"晴","temperatureC":24,"temperatureF":75,"apparentTemperatureC":27,"apparentTemperatureF":81,"precipitation":"10%","humidity":"89%","wind":{"beaufort":"≤1","speed":"1","direction":"西南風"},"feelLike":"舒適"},{"date":"10/18","time":"09:00","dateTime":"10/18 09:00","weekDay":"星期五","weather":"晴","temperatureC":27,"temperatureF":81,"apparentTemperatureC":31,"apparentTemperatureF":88,"precipitation":"10%","humidity":"72%","wind":{"beaufort":"2","speed":"3","direction":"西南風"},"feelLike":"舒適"},{"date":"10/18","time":"12:00","dateTime":"10/18 12:00","weekDay":"星期五","weather":"晴","temperatureC":31,"temperatureF":88,"apparentTemperatureC":34,"apparentTemperatureF":93,"precipitation":"10%","humidity":"63%","wind":{"beaufort":"2","speed":"3","direction":"偏西風"},"feelLike":"悶熱"},{"date":"10/18","time":"15:00","dateTime":"10/18 15:00","weekDay":"星期五","weather":"晴","temperatureC":30,"temperatureF":86,"apparentTemperatureC":35,"apparentTemperatureF":95,"precipitation":"10%","humidity":"75%","wind":{"beaufort":"2","speed":"2","direction":"西北風"},"feelLike":"悶熱"}],"openWeather":{"location":"Songwu","temperature":{"current":28.64,"apparent":34.15,"min":26.98,"max":29.25},"weather":{"main":"Clouds","description":"broken clouds"},"wind":{"speed":8.23,"direction":40},"clouds":75,"humidity":82}}
async function getWeahterSummary(): Promise<WeatherSummary> {
  const cwaTask = getWeathersFromCWA();
  const openWeatherTask = fetchWeatherFromOpenWeather();
  try {
    const cwa3Hours = await cwaTask;
    try {
      const openWeather = await openWeatherTask;
      return { cwa3Hours, openWeather };
    } catch {}
    return { cwa3Hours, openWeather: null };
  } catch {
    try {
      const openWeather = await openWeatherTask;
      return { cwa3Hours: [], openWeather };
    } catch {}
  }
  return { cwa3Hours: [], openWeather: null };
}
