import express from "express";
import { getCourseDetail } from "../services/pine";
import adaptParseBody from "../utils/adaptParseBody";
import PineCourse from "../services/mongoose/models/PineCourse";

const pineRouter = express.Router();

const courseSerialNumberKey = '流水號 / 課號';

pineRouter.use('/course-detail', async (req, res) => {
  const { id: _id } = adaptParseBody(req);
  const id = ((_id as undefined | string | number) || '').toString().padStart(5, '0');
  const courseDetailFromDatabase = await PineCourse.find({ [courseSerialNumberKey]: { $regex: new RegExp(`^${id}`) } })
  if (courseDetailFromDatabase) {
    console.log('FOUND');
    return courseDetailFromDatabase;
  }
  const courseDetail = await getCourseDetail(id);
  const courseSerialNumber = courseDetail[courseSerialNumberKey];
  const courseIsExists = !courseSerialNumber || courseSerialNumber.toString().startsWith('/')
  if (courseIsExists) {
    PineCourse.updateOne(
      { [courseSerialNumberKey]: courseSerialNumber },
      { $set: courseDetail },
      { upsert: true },
    );
  }
  res.send(courseDetail);
})

export default pineRouter;