import Jet from "@cch137/jet";

const router = new Jet.Router();

router.use(Jet.mergeQuery());

let result = { timestamp: NaN, rates: {} as Record<string, number> };

let itv: NodeJS.Timeout | null = null;

const updateData = async () => {
  if (itv !== null) clearInterval(itv), (itv = null);
  itv = setInterval(updateData, 60 * 1000);
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
    return (result = await res.json());
  } catch {}
  return null;
};

updateData();

const getData = async (filterKeys: string[] | null, force = false) => {
  if (force) await updateData();
  if (!filterKeys) return result;
  const { timestamp, rates: srcRates } = result;
  const rates: Record<string, number> = {};
  for (const key of filterKeys) rates[key] = srcRates[key];
  return { timestamp, rates: rates };
};

router.use("/xe", async (req, res) => {
  const { force, f: filterString } = req.query;
  const filterKeys =
    filterString && typeof filterString === "string"
      ? filterString.split(",")
      : null;
  const result = await getData(filterKeys, Boolean(force));
  if (isNaN(result.timestamp)) res.status(503).json({ error: "No Data" });
  else res.status(200).json(result);
});

export default router;
