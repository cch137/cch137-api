import Jet, { type JetRequest } from "@cch137/jet";
import Repo from "../github/index.js";
import parseForm from "../../utils/parseForm.js";

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

router.use("/ls", async (req, res) => {
  const { repo, path } = parseForm(req);
  res.send(
    ((await repos.get(repo)?.ls(path)) || [])
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

export default repos;
