import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const getGapTimestamp = (gap = 60000) => Math.floor(Date.now() / gap) * gap;

class DBRandomPageGetter {
  age = 60000;
  pointer = 0;
  lastFetched = 0;
  readonly dbId: string;
  readonly randColName: string;
  readonly pages: PageObjectResponse[] = [];

  constructor(dbId: string, randColName: string) {
    this.dbId = dbId;
    this.randColName = randColName;
  }

  #updating?: Promise<void>;
  async #update(force = false) {
    if (this.#updating && !force) {
      return await this.#updating;
    }
    this.#updating = new Promise<void>(async (resolve, reject) => {
      this.lastFetched = getGapTimestamp(this.age);
      const res = await notion.databases.query({
        sorts: [{ property: this.randColName, direction: "ascending" }],
        database_id: this.dbId,
      });
      this.pages.splice(0);
      this.pages.push(
        ...(res.results.filter(
          (i) => i.object === "page"
        ) as PageObjectResponse[])
      );
      resolve();
    });
    return await this.#updating;
  }

  async getItem() {
    await this.#update(Date.now() - this.lastFetched >= this.age);
    return this.pointer < this.pages.length
      ? this.pages[this.pointer++]
      : this.pages[(this.pointer = 0)];
  }
}

type DictionaryItem = {
  title: string;
  content: string;
};

const getItem = async (pageId: string) => {
  return await notion.pages.retrieve({
    page_id: pageId,
  });
};

const updateItem = async (
  pageId: string,
  { title, content }: DictionaryItem
) => {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Title: {
        title: [{ type: "text", text: { content: title } }],
      },
      Content: {
        rich_text: [{ type: "text", text: { content } }],
      },
    },
  });
};

export const isDictionaryItem = (item: any): item is DictionaryItem => {
  if (typeof item === "object") {
    return "title" in item && "content" in item;
  }
  return false;
};

export class Dictionary {
  readonly dbId: string;
  readonly #randomGetter: DBRandomPageGetter;

  constructor(dbId: string) {
    this.dbId = dbId;
    this.#randomGetter = new DBRandomPageGetter(this.dbId, "rand");
  }

  getItem = getItem;
  updateItem = updateItem;
  getRandomItem = () => this.#randomGetter.getItem();

  async createItem({ title, content }: DictionaryItem) {
    await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: this.dbId,
      },
      properties: {
        Title: {
          title: [{ type: "text", text: { content: title } }],
        },
        Content: {
          rich_text: [{ type: "text", text: { content } }],
        },
      },
    });
  }

  async deleteItem(pageId: string) {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
  }
}

export const DB_ID = "ead1e595673d43c4836d1a2044e8f740";
export const dictionary = new Dictionary(DB_ID);
export default dictionary;
