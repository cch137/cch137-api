import Jet, { type JetRequest } from "@cch137/jet";
import Repo from "../github/index.js";
import parseForm from "../../utils/parseForm.js";
import Shuttle from "@cch137/utils/shuttle/index.js";

const repos = new Map(
  ["113-recordings", "1122-linux-materials"].map((repo) => [
    repo,
    new Repo("cch137", repo),
  ])
);

export const router = new Jet.Router();

const isAuth = (req: JetRequest) => {
  return (
    req._url.searchParams.get("key") === process.env.CURVA_ASK_KEY ||
    req.body?.key === process.env.CURVA_ASK_KEY
  );
};

router.use(async (req, res, next) => {
  if (!isAuth(req)) return res.status(401).end();
  next();
});

router.use("/repos", async (_, res) => {
  res.send([...repos.keys()]);
});

router.use("/d", async (req, res) => {
  const { repo, path } = parseForm(req);
  const items = await repos.get(repo)?.ls(path);
  if (!items) return res.send(null);
  res.send(
    items
      .map(({ name, size, download_url, type }) => ({
        name,
        size,
        url: download_url,
        type,
      }))
      .sort()
  );
});

router.use("/f", async (req, res) => {
  const { repo, path } = parseForm(req);
  res.send(await repos.get(repo)?.getFile(path));
});

router.post("/action", async (req, res) => {
  const { repo, path, content } = Shuttle.unpack<{
    repo: any;
    path: any;
    content: any;
  }>(req.body);
  if (typeof repo !== "string") return res.status(400).end();
  if (typeof path !== "string") return res.status(400).end();
  if (!(content instanceof Uint8Array)) return res.status(400).end();
  res.send(await repos.get(repo)?.upload(path, content));
});

router.put("/action", async (req, res) => {
  const { repo, path, content } = Shuttle.unpack<{
    repo: any;
    path: any;
    content: any;
  }>(req.body);
  if (typeof repo !== "string") return res.status(400).end();
  if (typeof path !== "string") return res.status(400).end();
  if (!(content instanceof Uint8Array)) return res.status(400).end();
  res.send(await repos.get(repo)?.edit(path, content));
});

router.delete("/action", async (req, res) => {
  const { repo, path } = Shuttle.unpack<{
    repo: any;
    path: any;
  }>(req.body);
  if (typeof repo !== "string") return res.status(400).end();
  if (typeof path !== "string") return res.status(400).end();
  res.send(await repos.get(repo)?.delete(path));
});

export default repos;
