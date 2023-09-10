import express from "express";
import { courseSerialNumberKey, toCourseId, getCourseDetail } from "../services/pine";
import adaptParseBody from "../utils/adaptParseBody";
import PineCourse from "../services/mongoose/models/PineCourse";

PineCourse.schema.set('validateBeforeSave', false);

const pineRouter = express.Router();

pineRouter.use('/course-detail', async (req, res) => {
  const { id } = adaptParseBody(req);
  res.send(await getCourseDetail(id));
})

export default pineRouter;