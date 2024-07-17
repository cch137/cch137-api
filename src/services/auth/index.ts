// import Auth from "@cch137/auth";
// import { auth as mongoose } from "../mongooses/index.js";
// import Jet from "@cch137/jet";
// import Shuttle from "@cch137/shuttle";

// export const auth = new Auth({
//   appName: "CH4",
//   mailer: {
//     user: process.env.NODEMAILER_USER as string,
//     pass: process.env.NODEMAILER_PASS as string,
//   },
//   mongoose,
// });

// export default auth;

// export const router = new Jet.Router();

// console.log("hello world!1");

// router.ws(
//   "/auth",
//   async (ws, req) => {
//     req.method;
//     ws.on("message", (data) => {
//       if (Array.isArray(data)) data = Buffer.concat(data);
//       type Service = "user" | "session" | "track";
//       type Action = "get" | "set";
//       const [service, action, options] = Shuttle.parse<
//         [service: Service, action: Action, options: any]
//       >(Buffer.from(data));
//       switch (`${service}:${action}` as `${Service}:${Action}`) {
//         case "user:get": {
//           break;
//         }
//         case "user:set": {
//           break;
//         }
//         case "session:get": {
//           break;
//         }
//         case "session:set": {
//           break;
//         }
//         case "track:get": {
//           break;
//         }
//         case "track:set": {
//           break;
//         }
//       }
//     });
//   },
//   (soc, req, head) => req.getHeader("authorization") === process.env.AUTH_KEY
// );

// setTimeout(async () => {
//   const ws = new Jet.WebSocket("ws://localhost:5000/auth", {
//     headers: { authorization: process.env.AUTH_KEY as string },
//   });
//   ws.on("open", () => {});
//   console.log("OK");
// }, 0);
