import qs from "qs";

let secrets = {
  fSid: "",
  bl: "",
  lastUpdated: 0,
  isUpdating: false,
};

const extractKey = (key: string, content: string) => {
  const re = new RegExp(`"${key}":".*?"`);
  const result = re.exec(content);
  if (result) return result[0].replace(`"${key}":"`, "").slice(0, -1);
  return "";
};

const fetchSecrets = async (origin: string) => {
  try {
    const originContent = await (await fetch(origin)).text();
    return {
      fSid: extractKey("FdrFJe", originContent),
      bl: extractKey("cfb2h", originContent),
      lastUpdated: Date.now(),
    };
  } catch (e) {
    throw new Error("Failed to fetch secrets");
  }
};

const updateSecrets = async (origin: string, force: boolean = false) => {
  const now = Date.now();
  const elapsed = (now - secrets.lastUpdated) / 1000 / 60; // minutes

  // If secrets are being updated or have been updated recently (less than 5 minutes ago), do nothing.
  if (secrets.isUpdating || (elapsed < 5 && !force)) {
    return secrets;
  }

  secrets.isUpdating = true;

  try {
    if (elapsed >= 15 || force) {
      secrets = {
        ...secrets,
        ...(await fetchSecrets(origin)),
        isUpdating: false,
      };
      return secrets;
    }

    // Asynchronous update if within 5-15 minutes.
    setTimeout(async () => {
      try {
        const newSecrets = await fetchSecrets(origin);
        secrets = { ...secrets, ...newSecrets, isUpdating: false };
      } catch {
        secrets.isUpdating = false; // Ensure isUpdating is reset even on failure
      }
    }, 0);

    return secrets;
  } catch {
    secrets.isUpdating = false; // Reset isUpdating on failure
    throw new Error("Failed to update secrets");
  }
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
  forceUpdate?: boolean;
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
    forceUpdate,
  } = options;
  if (forceUpdate) secrets.lastUpdated = 0;
  const autoCorrect =
    _autoCorrect === undefined ? false : Boolean(_autoCorrect);
  const origin = `https://translate.google.${tld}`;

  // Get or update secrets as necessary
  await updateSecrets(origin);

  const data = {
    rpcids: "MkEWBc",
    "source-path": "/",
    "f.sid": secrets.fSid,
    bl: secrets.bl,
    hl: "en-US",
    "soc-app": 1,
    "soc-platform": 1,
    "soc-device": 1,
    _reqid: Math.floor(1000 + Math.random() * 9000),
    rt: "c",
  };

  const freq = [
    [
      [
        "MkEWBc",
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
          .map((obj: any) => obj[0])
          .filter(Boolean)
          .join(" ");

  result.pronunciation = json[1][0][0][1];

  if (json[0] && json[0][1] && json[0][1][1]) {
    result.from.language.didYouMean = true;
    result.from.language.iso = json[0][1][1][0];
  } else if (json[1][3] === "auto") {
    result.from.language.iso = json[2];
  } else {
    result.from.language.iso = json[1][3];
  }

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
