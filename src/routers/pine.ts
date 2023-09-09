import express from "express";
import { getCourseDetail } from "../services/pine";
import adaptParseBody from "../utils/adaptParseBody";
import PineCourse from "../services/mongoose/models/PineCourse";

PineCourse.schema.set('validateBeforeSave', false);

const pineRouter = express.Router();

const courseSerialNumberKey = '流水號 / 課號';

pineRouter.use('/course-detail', async (req, res) => {
  const { id: _id } = adaptParseBody(req);
  const id = ((_id as undefined | string | number) || '').toString().padStart(5, '0');
  const courseDetailFromDatabase = await PineCourse.findOne({ [courseSerialNumberKey]: { $regex: new RegExp(`^${id}`) } })
  if (courseDetailFromDatabase) {
    console.log('FOUND', courseDetailFromDatabase);
    res.send(courseDetailFromDatabase);
    return;
  }
  const courseDetail = await getCourseDetail(id);
  const courseSerialNumber = courseDetail[courseSerialNumberKey];
  const courseIsExists = !(!courseSerialNumber || courseSerialNumber.toString().startsWith('/'))
  if (courseIsExists) {
    PineCourse.create({ ...courseDetail, mtime: Date.now() });
  }
  res.send(courseDetail);
})

export default pineRouter;