import express from "express";
import { getCourseDetail } from "./services/pine";
import adaptParseBody from "./utils/adaptParseBody";

const pineRouter = express.Router();

pineRouter.use('/course-detail', async (req, res) => {
  const { id } = adaptParseBody(req)
  res.send(await getCourseDetail(id));
})

export default pineRouter;