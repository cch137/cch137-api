import { Router } from "express";
import Repo from "../github";

const files = new Repo("cch137", "api-files-private");

export const router = Router();

router.get("/:uid/:fid", (req, res) => {
  res.status(501).send("Not Implemented");
});

router.put("/:uid/:fid", (req, res) => {
  res.status(501).send("Not Implemented");
});

router.delete("/:uid/:fid", (req, res) => {
  res.status(501).send("Not Implemented");
});
