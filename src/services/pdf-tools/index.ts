import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { pdf as pdfToImages } from "pdf-to-img";
import JSZip from "jszip";
import random from "@cch137/random";

export class ImagesToPDF {
  readonly id: string;
  private readonly files: Uint8Array[] = [];
  #killTimeout?: NodeJS.Timeout;
  converted?: Promise<Uint8Array>;

  constructor() {
    this.id = random.base64url(16);
    ImagesToPDF.tasks.set(this.id, this);
    this.alive();
  }

  private alive() {
    clearTimeout(this.#killTimeout);
    this.#killTimeout = setTimeout(() => this.kill(), 15 * 60000);
  }

  private kill() {
    clearTimeout(this.#killTimeout);
    ImagesToPDF.tasks.delete(this.id);
  }

  upload(index: number, file: Uint8Array) {
    if (this.converted) return;
    if (typeof index !== "number") return;
    if (!(file instanceof Uint8Array)) return;
    this.alive();
    this.files[index] = file;
  }

  async convert() {
    this.alive();
    if (this.converted) return await this.converted;
    this.converted = new Promise<Uint8Array>(async (resolve, reject) => {
      const doc = await PDFDocument.create();
      const files = this.files.filter(Boolean);
      this.files.splice(0);
      for (const file of files) {
        try {
          const image = sharp(file).jpeg();
          const { width: w, height: h } = await image.metadata();
          if (!w || !h) throw new Error("Width and height not exist");
          const page = doc.addPage([w, h]);
          const pageW = page.getWidth();
          const pageH = page.getHeight();
          const imageEmbed = await doc.embedJpg(await image.toBuffer());
          const { width: imageW, height: imageH } = imageEmbed.scaleToFit(
            pageW,
            pageH
          );
          page.drawImage(imageEmbed, {
            x: pageW / 2 - imageW / 2,
            y: pageH / 2 - imageH / 2,
            width: imageW,
            height: imageH,
          });
        } catch (e) {
          console.error(e);
        }
      }
      try {
        resolve(await doc.save());
      } catch (e) {
        reject(e);
      }
    });
    this.alive();
    return await this.converted;
  }

  static tasks = new Map<string, ImagesToPDF>();

  static createTask() {
    return new ImagesToPDF();
  }

  static upload(id: string, index: number, file: Uint8Array) {
    const task = ImagesToPDF.tasks.get(id);
    if (task) task.upload(index, file);
  }

  static async convert(id: string) {
    const task = ImagesToPDF.tasks.get(id);
    if (!task)
      return await new Promise<Uint8Array>((r) => r(new Uint8Array([])));
    return await task.convert();
  }
}

export class PDFToImages {
  static async convert(
    input: string | Uint8Array | Buffer | NodeJS.ReadableStream
  ) {
    let i = 1;
    const document = await pdfToImages(input, { scale: 2 });

    const zip = new JSZip();

    for await (const image of document) zip.file(`${i++}.png`, image);

    return await zip.generateAsync({ type: "uint8array" });
  }
}
