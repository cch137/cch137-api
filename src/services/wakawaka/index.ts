import random from "@cch137/utils/random/index.js";
import Jet from "@cch137/jet/index.js";
import parseForm from "../../utils/parseForm.js";
import Repo from "../github/index.js";
import { study } from "../mongooses/index.js";

const apiFiles = new Repo("cch137", "api-files");

async function upload(filename: string, content: Buffer | Uint8Array | string) {
  const id = crypto.randomUUID();
  await apiFiles.upload(`i/${id}/${filename}`, content);
  return { id, filename };
}

export type ListType = {
  name: string;
  enabled: boolean;
  pages: string[];
  expire: Date;
  user: string;
};

export type PageType = {
  name: string;
  enabled: boolean;
  type: string;
  content: string;
  images: string[];
  expire: Date;
  user: string;
  list: string;
};

export type BlockType = {
  type: string;
  content: string;
  user: string;
  list: string;
  page: string;
};

class Session {
  private static checkNeeded = Date.now() + 15 * 60000;
  private static readonly sessions = new Map<string, Session>();
  static get(sid?: string) {
    if (typeof sid !== "string") return void 0;
    const now = Date.now();
    if (Session.checkNeeded < now) {
      Session.checkNeeded = now + 15 * 60000;
      [...Session.sessions]
        .filter(([_, sess]) => now > sess.expire)
        .forEach(([i]) => Session.sessions.delete(i));
    }
    return Session.sessions.get(sid);
  }
  static create(uid: string) {
    return new Session(uid);
  }
  readonly uid: string;
  readonly sid: string;
  readonly expire: number;
  constructor(uid: string) {
    this.uid = uid;
    this.sid = random.base64url(32);
    // expire after 1 hour
    this.expire = Date.now() + 60 * 60 * 1000;
    Session.sessions.set(this.sid, this);
  }
}

const List = study.model<ListType>(
  "List",
  new study.Schema(
    {
      name: String,
      enabled: Boolean,
      pages: [String],
      expire: Date,
      user: String,
    },
    { versionKey: false }
  ),
  "lists",
  { overwriteModels: true }
);

const Page = study.model<PageType>(
  "Page",
  new study.Schema(
    {
      name: String,
      enabled: Boolean,
      type: String,
      content: String,
      images: [String],
      expire: Date,
      user: String,
      list: String,
    },
    { versionKey: false }
  ),
  "pages",
  { overwriteModels: true }
);

type Oid = string;

const lists = {
  List,
  async getLists(user: string) {
    return await List.find(
      { user },
      { name: 1, _id: 1, expire: 1, enabled: 1 }
    );
  },
  async create(user: Oid, list: ListType) {
    return (await List.create({ ...list, user }))._id;
  },
  async update(user: Oid, _id: Oid, item: ListType) {
    return await List.updateOne({ _id, user }, { $set: item });
  },
  async delete(user: Oid, _id: Oid) {
    return await Promise.all([
      List.deleteOne({ user, _id }),
      Page.deleteMany({ user, list: _id }),
    ]);
  },
};

const pages = {
  Page,
  async getByListId(user: Oid, listId: Oid) {
    return await Page.find(
      { list: listId, user },
      { _id: 1, name: 1, enabled: 1, expire: 1 }
    );
  },
  async get(user: Oid, _id: Oid) {
    return await Page.findOne(
      { _id, user },
      { _id: 1, name: 1, enabled: 1, expire: 1, blocks: 1 }
    );
  },
  async create(user: Oid, listId: Oid, page: PageType) {
    const item = await Page.create({ ...page, user });
    await List.updateOne(
      { _id: listId, user },
      { $push: { pages: item._id.toHexString() } }
    );
    return item._id;
  },
  async update(user: Oid, listId: Oid, _id: Oid, page: PageType) {
    return await Page.updateOne({ _id, user, list: listId }, { $set: page });
  },
  async delete(user: Oid, listId: Oid, _id: Oid) {
    return await Promise.all([
      List.updateOne({ _id: listId, user }, { $pull: { pages: _id } }),
      Page.deleteOne({ _id, user }),
    ]);
  },
};

const wk = {
  Session,
  lists,
  pages,
  async getLists(user: string) {
    return await lists.getLists(user);
  },
  async createList(user: string, name: string) {
    return await lists.create(user, {
      name,
      enabled: true,
      expire: new Date(),
      pages: [],
      user,
    });
  },
  async updateList(user: Oid, id: Oid, item: ListType) {
    await lists.update(user, id, item);
  },
  async deleteList(user: Oid, id: Oid) {
    await lists.delete(user, id);
  },
  async getPages(user: string, list: string) {
    return await pages.getByListId(user, list);
  },
  async createPage(user: string, list: string, name: string) {
    return await pages.create(user, list, {
      name,
      enabled: true,
      expire: new Date(),
      type: "text",
      content: "",
      images: [],
      user,
      list,
    });
  },
  async updatePage(user: Oid, gid: Oid, cid: Oid, item: PageType) {
    await pages.update(user, gid, cid, item);
  },
  async deletePage(user: Oid, gid: Oid, cid: Oid) {
    await pages.delete(user, gid, cid);
  },
  async getPageDetails(user: string, pageId: string) {
    const page = await Page.findOne(
      { user, _id: pageId },
      { _id: 0, type: 1, content: 1, images: 1 }
    );
    if (!page) return { error: "not found" };
    const { type, content, images } = page;
    return { type, content, images };
  },
  async pushImages(user: string, pageId: string, images: any) {
    if (!(Array.isArray(images) && images.every((i) => typeof i === "string")))
      return;
    await Page.updateOne(
      { _id: pageId, user },
      { $push: { images: { $each: images } } }
    );
  },
  async pullImages(user: string, pageId: string, images: any) {
    if (!(Array.isArray(images) && images.every((i) => typeof i === "string")))
      return;
    await Page.updateOne(
      { _id: pageId, user },
      { $pull: { images: { $each: images } } }
    );
  },
  async enableCards(user: Oid, gid: Oid) {
    await Promise.all([
      List.updateOne({ user, _id: gid }, { $set: { enabled: true } }),
      Page.updateMany({ user, list: gid }, { $set: { enabled: true } }),
    ]);
  },
  async disableCards(user: Oid, gid: Oid) {
    await Promise.all([
      List.updateOne({ user, _id: gid }, { $set: { enabled: false } }),
      Page.updateMany({ user, list: gid }, { $set: { enabled: false } }),
    ]);
  },
  async activateCards(user: Oid, gid: Oid) {
    const expire = new Date();
    await Promise.all([
      List.updateOne({ user, _id: gid }, { $set: { enabled: true, expire } }),
      Page.updateMany({ user, list: gid }, { $set: { enabled: true, expire } }),
    ]);
  },
};

export default wk;

export const router = new Jet.Router();

router.post("/session", async (req, res) => {
  const { uid, key } = parseForm(req);
  if (key !== process.env.CURVA_ASK_KEY) return res.status(401).json({});
  if (typeof uid !== "string" || !uid) return res.status(401).json({});
  res.type("text").send(wk.Session.create(uid).sid);
});

router.post("/image", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  try {
    const _fn = req.headers["filename"];
    const filename = (Array.isArray(_fn) ? _fn[0] : _fn) || "image.webp";
    res.send(await upload(filename, req.body));
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

router.get("/", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.getLists(user));
});

router.post("/", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const { name } = parseForm(req);
  if (!name) return res.status(400).end();
  res.send(await wk.createList(user, name));
});

router.put("/:gid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const item = parseForm(req);
  res.send(await wk.updateList(user, req.params.gid, item as any));
});

router.delete("/:gid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.deleteList(user, req.params.gid));
});

router.get("/:gid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.getPages(user, req.params.gid));
});

router.post("/:gid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const { name } = parseForm(req);
  if (!name) return res.status(400).end();
  res.send(await wk.createPage(user, req.params.gid, name));
});

router.post("/:gid/enable", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.enableCards(user, req.params.gid));
});

router.post("/:gid/disable", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.disableCards(user, req.params.gid));
});

router.post("/:gid/activate", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.activateCards(user, req.params.gid));
});

router.put("/:gid/:cid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const item = parseForm(req);
  res.send(
    await wk.updatePage(user, req.params.gid, req.params.cid, item as any)
  );
});

router.delete("/:gid/:cid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.deletePage(user, req.params.gid, req.params.cid));
});

router.get("/:gid/:cid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.getPageDetails(user, req.params.cid));
});

router.post("/:gid/:cid/images", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const { images } = parseForm(req);
  res.send(await wk.pushImages(user, req.params.cid, images));
});

router.delete("/:gid/:cid/images", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const { images } = parseForm(req);
  res.send(await wk.pullImages(user, req.params.cid, images));
});
