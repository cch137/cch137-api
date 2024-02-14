import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import random from "@cch137/utils/random";

export class ImagesToPDF {
  readonly id: string;
  #files = new Map<number, Uint8Array>();
  killTimeout: NodeJS.Timeout;

  constructor() {
    this.id = random.base64(16);
    ImagesToPDF.tasks.set(this.id, this);
    this.killTimeout = setTimeout(() => this.kill(), 15 * 60000);
  }

  alive() {
    clearTimeout(this.killTimeout);
    this.killTimeout = setTimeout(() => this.kill(), 60 * 60000);
  }

  kill() {
    clearTimeout(this.killTimeout);
    ImagesToPDF.tasks.delete(this.id);
  }

  get files() {
    return [...this.#files.keys()]
      .sort()
      .map((i) => this.#files.get(i) as Uint8Array);
  }

  upload(index: number, file: Uint8Array) {
    if (this.converted) return;
    if (typeof index !== "number") return;
    if (!(file instanceof Uint8Array)) return;
    this.alive();
    this.#files.set(index, file);
  }

  converted?: Promise<Uint8Array>;
  async convert() {
    if (this.converted) return await this.converted;
    this.converted = new Promise<Uint8Array>(async (resolve, reject) => {
      const doc = await PDFDocument.create();
      const { files } = this;
      for (const file of files) {
        try {
          const image = sharp(file).jpeg();
          const { width: w, height: h } = await image.metadata();
          if (!w || !h) throw new Error("Width and height not exist");
          const page = doc.addPage([w, h]);
          const imageEmbed = await doc.embedJpg(await image.toBuffer());
          const { width, height } = imageEmbed.scaleToFit(
            page.getWidth(),
            page.getHeight()
          );
          page.drawImage(imageEmbed, {
            x: page.getWidth() / 2 - width / 2,
            y: page.getHeight() / 2 - height / 2,
            width,
            height,
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
    this.kill();
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
