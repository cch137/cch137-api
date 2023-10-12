import express from "express";
import multer from "multer";
import adaptParseBody from "../utils/adaptParseBody";
import pdfTools from "../services/pdf-tools";

const pdfRouter = express.Router();

const upload = multer();

pdfRouter.post('/pdf-to-png', upload.any(), async (req, res) => {
  // const file = (req.files || [])[0] || req.file as 
  // const { outputType = 'png' } = adaptParseBody(req);
  // pdfTools.pdfToImg()
})

pdfRouter.use('/png-to-pdf', async (req, res) => {
  const { id } = adaptParseBody(req);
  pdfTools.pngToPdf()
})

export default pdfRouter;