import Jet from "@cch137/jet/index.js";
import Repo from "../github/index.js";

const files = new Repo("cch137", "api-files-private");

export const router = new Jet.Router();

router.get("/:uid/:fid", (req, res) => {
  res.status(501).send("Not Implemented");
});

router.put("/:uid/:fid", (req, res) => {
  res.status(501).send("Not Implemented");
});

router.delete("/:uid/:fid", (req, res) => {
  res.status(501).send("Not Implemented");
});
