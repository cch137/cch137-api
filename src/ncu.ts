import express from "express";
import { getCourseDetail } from "./services/ncu";
import adaptParseBody from "./utils/adaptParseBody";

const ncuRouter = express.Router();

ncuRouter.use('/course-detail', async (req, res) => {
  const { id } = adaptParseBody(req)
  res.send(await getCourseDetail(id));
})

export default ncuRouter;