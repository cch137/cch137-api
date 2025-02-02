import mongoose from "mongoose";
import { config as env } from "dotenv";

env();

// export const auth = new mongoose.Mongoose();
// auth
//   .connect(process.env.DB_URI_AUTH as string)
//   .then(() => console.log("connected to database [auth]"))
//   .catch(() => console.error("failed to connect to database [auth]"));

// export const cch137 = new mongoose.Mongoose();
// cch137
//   .connect(process.env.DB_URI_CCH137 as string)
//   .then(() => console.log("connected to database [cch137]"))
//   .catch(() => console.error("failed to connect to database [cch137]"));

export const study = new mongoose.Mongoose();
study
  .connect(process.env.DB_URI_STUDY as string)
  .then(() => console.log("connected to database [study]"))
  .catch(() => console.error("failed to connect to database [study]"));
