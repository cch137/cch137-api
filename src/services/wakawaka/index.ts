import random from "@cch137/utils/random";
import mongoose, { Schema } from "mongoose";
import { Router } from "express";
import parseForm from "../../utils/parseForm";
import Repo from "../github";

const apiFiles = new Repo("cch137", "api-files");

async function upload(filename: string, content: Buffer | Uint8Array | string) {
  const id = crypto.randomUUID();
  await apiFiles.upload(`i/${id}/${filename}`, content);
  return { id, filename };
}

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("connected to mongodb"))
  .catch(() => console.log("error connecting to mongodb"));

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
  blocks: string[];
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
    this.sid = random.base64(32);
    // expire after 1 hour
    this.expire = Date.now() + 60 * 60 * 1000;
    Session.sessions.set(this.sid, this);
  }
}

const List = mongoose.model<ListType>(
  "List",
  new Schema(
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

const Page = mongoose.model<PageType>(
  "Page",
  new Schema(
    {
      name: String,
      enabled: Boolean,
      blocks: [String],
      expire: Date,
      user: String,
      list: String,
    },
    { versionKey: false }
  ),
  "pages",
  { overwriteModels: true }
);

const Block = mongoose.model<BlockType>(
  "Block",
  new Schema(
    {
      type: String,
      content: String,
      user: String,
      list: String,
      page: String,
    },
    { versionKey: false }
  ),
  "blocks",
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
      Block.deleteMany({ user, list: _id }),
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
      Block.deleteMany({ page: _id, user }),
    ]);
  },
};

const blocks = {
  Block,
  async getByPageId(user: Oid, pageIds: Oid) {
    return await Block.find(
      { user, page: pageIds },
      { _id: 1, type: 1, content: 1 }
    );
  },
  async insertMany(user: Oid, pageId: Oid, blocks: BlockType[]) {
    const items = await Block.insertMany(blocks.map((i) => ({ ...i, user })));
    const ids = items.map((i) => i._id.toHexString());
    await Page.updateOne(
      { _id: pageId, user },
      { $push: { blocks: { $each: ids } } }
    );
    return ids;
  },
  async update(user: Oid, _id: Oid, block: BlockType) {
    return await Block.updateOne({ _id, user }, { $set: block });
  },
  async delete(user: Oid, pageId: Oid, _id: Oid) {
    return await Promise.all([
      Page.updateOne({ _id: pageId, user }, { $pull: { blocks: _id } }),
      Block.deleteOne({ _id, user }),
    ]);
  },
};

const wk = {
  Session,
  lists,
  pages,
  blocks,
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
      blocks: [],
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
  async getBlocks(user: string, pageId: string) {
    const _blocks = await blocks.getByPageId(user, pageId);
    const page = await pages.get(user, pageId);
    return page
      ? page.blocks.map((bId) =>
          _blocks.find((i) => i._id.toHexString() === bId)
        )
      : _blocks;
  },
  async createBlocks(
    user: string,
    list: string,
    page: string,
    _blocks: { type: string; content: string }[]
  ) {
    return await blocks.insertMany(
      user,
      page,
      _blocks.map(({ type, content }) => ({
        type,
        content,
        user,
        list,
        page,
      }))
    );
  },
  async updateBlock(user: Oid, bid: Oid, item: BlockType) {
    await blocks.update(user, bid, item);
  },
  async deleteBlock(user: Oid, cid: string, bid: Oid) {
    await blocks.delete(user, cid, bid);
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

export const router = Router();

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
  res.send(await wk.getBlocks(user, req.params.cid));
});

router.post("/:gid/:cid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const { type, content, blocks: bs = [] } = parseForm(req);
  if ((!type || !content) && bs.length === 0) return res.status(400).end();
  if (type && content) bs.unshift({ type, content });
  res.send(await wk.createBlocks(user, req.params.gid, req.params.cid, bs));
});

router.put("/:gid/:cid/:bid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  const item = parseForm(req);
  res.send(await wk.updateBlock(user, req.params.bid, item as any));
});

router.delete("/:gid/:cid/:bid", async (req, res) => {
  const user = wk.Session.get(req.headers["authorization"])?.uid;
  if (!user) return res.status(401).end();
  res.send(await wk.deleteBlock(user, req.params.cid, req.params.bid));
});
