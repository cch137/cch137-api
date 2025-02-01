import Jet from "@cch137/jet";

const router = new Jet.Router();

let timestamp = NaN;
let rates: Record<string, number> | null = null;

let itv: NodeJS.Timeout | null = null;

const updateData = async (force = false) => {
  if (force && itv !== null) clearInterval(itv), (itv = null);
  if (itv === null) itv = setInterval(updateData, 60 * 1000);
  try {
    const res = await fetch(
      "https://www.xe.com/api/protected/midmarket-converter/",
      {
        headers: {
          Authorization: "Basic ".concat(
            btoa("".concat("lodestar", ":").concat("pugsnax"))
          ),
        },
      }
    );
    const { timestamp: resTimestamp, rates: resRates } = await res.json();
    timestamp = resTimestamp;
    rates = resRates;
    return { timestamp, rates };
  } catch {}
  return null;
};

const getRates = (
  keys: null | string[],
  srcRates?: Record<string, number> | null
) => {
  srcRates ??= rates;
  if (!keys || !srcRates) return srcRates;
  const resRates: Record<string, number> = {};
  for (const key of keys) resRates[key] = srcRates[key];
  return resRates;
};

updateData();

router.use("/xe", async (req, res) => {
  const { force, f: filterString } = Jet.getParams(req);
  const filterKeys =
    filterString && typeof filterString === "string"
      ? filterString.split(",")
      : null;
  if (force) {
    try {
      const result = await updateData();
      if (!result) throw new Error("No data");
      return res.status(200).json({
        timestamp: result.timestamp,
        rates: getRates(filterKeys, result.rates),
      });
    } catch {}
  }
  res
    .status(rates ? 200 : 503)
    .json({ timestamp, rates: getRates(filterKeys) });
});

export default router;
