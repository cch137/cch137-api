import Jet from "@cch137/jet";
import parseForm from "../../utils/parseForm.js";

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

updateData();

router.use("/xe", async (req, res) => {
  const { force } = parseForm(req);
  if (force) {
    try {
      return res.status(200).json(await updateData());
    } catch {}
  }
  if (rates) res.status(200).json({ timestamp, rates });
  else res.status(503).json({ error: "No data" });
});

export default router;
