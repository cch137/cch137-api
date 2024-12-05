import { Client } from "@notionhq/client";
import Jet from "@cch137/jet/index.js";

export const router = new Jet.Router();

const nodeDatabaseId = "108844b8090480369a08c0e22fea071d";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function getPublishedNotes() {
  try {
    const response = await notion.databases.query({
      database_id: nodeDatabaseId,
    });

    while (response.next_cursor) {
      const next = await notion.databases.query({
        database_id: nodeDatabaseId,
        start_cursor: response.next_cursor,
      });
      response.results.push(...next.results);
      response.next_cursor = next.next_cursor;
    }

    return response.results
      .filter((page) => {
        if (page.object !== "page") return false;
        const published =
          (page as any).properties["Published"] ||
          (page as any).properties["published"];
        if (!published) return false;
        if (published.type !== "checkbox") return false;
        return published.checkbox;
      })
      .sort((a, b) => {
        const aDate = new Date((a as any).created_time);
        const bDate = new Date((b as any).created_time);
        const diff = aDate.getTime() - bDate.getTime();
        return diff === 0 ? 0 : diff > 0 ? 1 : -1;
      })
      .map((page) => {
        const title = (
          (
            (page as any)?.properties?.["Name"] ||
            (page as any)?.properties?.["name"] ||
            (page as any)?.properties?.["Title"] ||
            (page as any)?.properties?.["title"]
          )?.title || []
        ).find((i: any) => "text" in i)?.text?.content;
        return { id: page.id, title };
      });
  } catch {}
  return [];
}

router.get("/notes", async (req, res) => {
  res.json(await getPublishedNotes());
});
