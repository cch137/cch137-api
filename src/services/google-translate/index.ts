/**
 * Code forked from:
 * https://github.com/vitalets/google-translate-api/
 * https://www.npmjs.com/package/@saipulanuar/google-translate-api
 */

import qs from "qs";

const extractKey = (key: string, content: string) => {
  const re = new RegExp(`"${key}":".*?"`);
  const result = re.exec(content);
  if (result) return result[0].replace(`"${key}":"`, "").slice(0, -1);
  return "";
};

export type TranslateApiResponse = {
  text: string;
  pronunciation: string;
  from: {
    language: {
      didYouMean: boolean;
      iso: string;
    };
    text: {
      autoCorrected: boolean;
      value: string;
      didYouMean: boolean;
    };
  };
  raw?: any;
};

export type TranslateApiOptions = {
  from?: string;
  to?: string;
  tld?: string;
  autoCorrect?: boolean;
};

export default async function googleTranslate(
  text: string,
  options: TranslateApiOptions = {}
) {
  const {
    from = "auto",
    to = "en",
    tld = "com",
    autoCorrect: _autoCorrect,
  } = options;
  const autoCorrect =
    _autoCorrect === undefined ? false : Boolean(_autoCorrect);
  const origin = `https://translate.google.${tld}`;

  // according to translate.google.com constant rpcids seems to have different values with different POST body format.
  // * MkEWBc - returns translation
  // * AVdN8 - return suggest
  // * exi25c - return some technical info
  const rpcids = "MkEWBc";
  const originContent = await (await fetch(origin)).text();
  const data = {
    rpcids,
    "source-path": "/",
    "f.sid": extractKey("FdrFJe", originContent),
    bl: extractKey("cfb2h", originContent),
    hl: "en-US",
    "soc-app": 1,
    "soc-platform": 1,
    "soc-device": 1,
    _reqid: Math.floor(1000 + Math.random() * 9000),
    rt: "c",
  };
  // format for freq below is only for rpcids = MkEWBc
  const freq = [
    [
      [
        rpcids,
        JSON.stringify([[text, from, to, autoCorrect], [null]]),
        null,
        "generic",
      ],
    ],
  ];

  const apiResponse = await (
    await fetch(
      `${origin}/_/TranslateWebserverUi/data/batchexecute?${qs.stringify(
        data
      )}`,
      {
        method: "POST",
        body: "f.req=" + encodeURIComponent(JSON.stringify(freq)) + "&",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      }
    )
  ).text();

  const result: TranslateApiResponse = {
    text: "",
    pronunciation: "",
    from: {
      language: {
        didYouMean: false,
        iso: "",
      },
      text: {
        autoCorrected: false,
        value: "",
        didYouMean: false,
      },
    },
  };

  const jsonString = apiResponse.slice(6);
  let json;
  try {
    const length = /^\d+/.exec(jsonString)![0];
    json = JSON.parse(
      JSON.parse(
        jsonString.slice(length.length, parseInt(length, 10) + length.length)
      )[0][2]
    );
  } catch (e) {
    result.raw = jsonString;
    return result;
  }

  result.text =
    json[1][0][0][5] === undefined || json[1][0][0][5] === null
      ? json[1][0][0][0]
      : (json[1][0][0][5] as any as string[])
          .map(function (obj: any) {
            return obj[0];
          })
          .filter(Boolean)
          // Google api seems to split text per sentences by <dot><space>
          // So we join text back with spaces.
          // See: https://github.com/vitalets/google-translate-api/issues/73
          .join(" ");

  result.pronunciation = json[1][0][0][1];

  // From language
  if (json[0] && json[0][1] && json[0][1][1]) {
    result.from.language.didYouMean = true;
    result.from.language.iso = json[0][1][1][0];
  } else if (json[1][3] === "auto") {
    result.from.language.iso = json[2];
  } else {
    result.from.language.iso = json[1][3];
  }

  // Did you mean & autocorrect
  if (json[0] && json[0][1] && json[0][1][0]) {
    result.from.text.value = json[0][1][0][0][1]
      .replace(/<b>(<i>)?/g, "[")
      .replace(/(<\/i>)?<\/b>/g, "]");
    if ((json[0][1][0][2] as any) === 1) {
      result.from.text.autoCorrected = true;
    } else {
      result.from.text.didYouMean = true;
    }
  }

  return result;
}
