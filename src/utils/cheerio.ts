import { CheerioAPI, type Cheerio, type Element } from "cheerio";

export type TextNode = string | TextNode[];

export const cheerioToTextNodes = (
  el: Cheerio<Element>,
  $: CheerioAPI
): TextNode => {
  const children = [...el.children()];
  if (children.length === 0) return [el.text().trim()];
  return children
    .map((el) => {
      const node = cheerioToTextNodes($(el), $);
      return Array.isArray(node) ? (node.length === 1 ? node[0] : node) : node;
    })
    .filter(
      (node) =>
        !(Array.isArray(node) && node.length === 0) &&
        !(typeof node === "string" && !node)
    );
};
