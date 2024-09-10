import Jet from "@cch137/jet";
import Repo from "../github/index.js";
import parseForm from "../../utils/parseForm.js";

const tw113_recordings = new Repo("cch137", "113-recordings");

export const router = new Jet.Router();

router.use("/113-recordings", async (req, res) => {
  const { key } = parseForm(req);
  if (key !== process.env.CURVA_ASK_KEY) {
    res.status(401).end();
    return;
  }
  const items = ((await tw113_recordings.ls("./assets/")) || [])
    .filter((i) => i.type === "file")
    .map(({ name, size, download_url }) => ({
      name,
      size,
      url: download_url,
    }))
    .sort();
  res.send(items);
});

export default tw113_recordings;
