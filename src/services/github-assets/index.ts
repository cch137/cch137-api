import Jet, { type JetRequest } from "@cch137/jet";
import Repo from "../github/index.js";

const repos = new Map(["gaia"].map((repo) => [repo, new Repo("cch137", repo)]));

export const router = new Jet.Router();

const isAuth = (req: JetRequest) => {
  const { key } = Jet.getParams(req);
  return key === process.env.CURVA_ASK_KEY;
};

router.use(async (req, res, next) => {
  if (!isAuth(req)) return res.status(401).end();
  next();
});

router.use("/repos", async (_, res) => {
  res.send([...repos.keys()]);
});

router.use("/get", async (req, res) => {
  const { repo, path } = Jet.getParams(req);
  res.send(await repos.get(repo)?.get(path));
});

router.use("/d", async (req, res) => {
  const { repo, path } = Jet.getParams(req);
  const items = await repos.get(repo)?.getDirectory(path);
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
  const { repo, path } = Jet.getParams(req);
  res.send(await repos.get(repo)?.getFile(path));
});

// router.post("/action", async (req, res) => {
//   const { repo, path, content } = Shuttle.unpack<{
//     repo: any;
//     path: any;
//     content: any;
//   }>(req.body);
//   if (typeof repo !== "string") return res.status(400).end();
//   if (typeof path !== "string") return res.status(400).end();
//   if (!(content instanceof Uint8Array)) return res.status(400).end();
//   res.send(await repos.get(repo)?.create(path, content));
// });

// router.put("/action", async (req, res) => {
//   const { repo, path, content } = Shuttle.unpack<{
//     repo: any;
//     path: any;
//     content: any;
//   }>(req.body);
//   if (typeof repo !== "string") return res.status(400).end();
//   if (typeof path !== "string") return res.status(400).end();
//   if (!(content instanceof Uint8Array)) return res.status(400).end();
//   res.send(await repos.get(repo)?.update(path, content));
// });

// router.delete("/action", async (req, res) => {
//   const { repo, path } = Shuttle.unpack<{
//     repo: any;
//     path: any;
//   }>(req.body);
//   if (typeof repo !== "string") return res.status(400).end();
//   if (typeof path !== "string") return res.status(400).end();
//   res.send(await repos.get(repo)?.delete(path));
// });

export default repos;
