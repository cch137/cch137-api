import Jet from "@cch137/jet";

const router = new Jet.Router();

let timestamp = NaN;
let rates: Record<string, number> | null = null;
let cacheString = JSON.stringify({ timestamp, rates });

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
    cacheString = JSON.stringify({ timestamp, rates });
    return cacheString;
  } catch {}
  return null;
};

updateData();

router.use("/xe", async (req, res) => {
  const { force } = Jet.getParams(req);
  if (force) {
    try {
      return res
        .status(200)
        .type("json")
        .send(await updateData());
    } catch {}
  }
  res
    .status(rates ? 200 : 503)
    .type("json")
    .send(cacheString);
});

export default router;
