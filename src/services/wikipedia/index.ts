import axios, { AxiosResponse } from "axios";
import { detectLanguage } from "@cch137/format-utils/detect-languages";

const defaultApiUrl: string = "https://en.wikipedia.org/w/api.php";

function decideApiDomain(text: string, langCode?: string) {
  const lang = langCode || detectLanguage(text) || "en";
  return {
    url: `https://${lang}.wikipedia.org/w/api.php`,
    lang,
  };
}

interface WikipediaSearchParams {
  action: string;
  format: string;
  titles?: string;
  prop?: string;
  exintro?: boolean;
  explaintext?: boolean;
  list?: string;
  srsearch?: string;
  pageids?: string;
}

async function fetchArticle(
  searchTerm: string,
  apiUrl: string = defaultApiUrl
): Promise<string | null> {
  const params: WikipediaSearchParams = {
    action: "query",
    format: "json",
    titles: searchTerm,
    prop: "extracts",
    exintro: true,
    explaintext: true,
  };

  try {
    const response: AxiosResponse = await axios.get(apiUrl, { params });
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") {
      return null; // 表示未找到相關文章
    }

    const article: string = pages[pageId].extract;
    if (typeof article === "string") {
      const keywords = article
        .split("\n")
        .map((l) => l.trim().split(",")[0].trim())
        .filter((l) => l);
      if (keywords.length < 2) {
        return null;
      }
      // if (true||keywords[0].endsWith('refer to:')) {
      //   return await fetchArticleByPageId(await getClosestTitlePageId(keywords[1], apiUrl), apiUrl);
      // }
    }

    return article.trim();
  } catch (error) {
    throw new Error(
      `Error fetching Wikipedia article: ${
        (error as Error)?.message || "Unknown error"
      }`
    );
  }
}

async function getClosestTitlePageId(
  searchTerm: string,
  apiUrl: string = defaultApiUrl
): Promise<string> {
  const searchParams: WikipediaSearchParams = {
    action: "query",
    format: "json",
    list: "search",
    srsearch: searchTerm,
  };

  try {
    const searchResponse: AxiosResponse = await axios.get(apiUrl, {
      params: searchParams,
    });
    const searchResults = searchResponse.data.query.search;

    if (searchResults.length > 0) {
      return searchResults[0].pageid.toString();
    } else {
      throw new Error("No close match found.");
    }
  } catch (error) {
    throw new Error(
      `Error searching for closest title: ${
        (error as Error)?.message || "Unknown error"
      }`
    );
  }
}

async function fetchArticleByPageId(
  pageId: string,
  apiUrl: string = defaultApiUrl
): Promise<string> {
  const params: WikipediaSearchParams = {
    action: "query",
    format: "json",
    pageids: pageId,
    prop: "extracts",
    exintro: true,
    explaintext: true,
  };

  try {
    const response: AxiosResponse = await axios.get(apiUrl, { params });
    const pages = response.data.query.pages;
    const article: string = pages[pageId].extract;

    return article;
  } catch (error) {
    throw new Error(
      `Error fetching Wikipedia article: ${
        (error as Error)?.message || "Unknown error"
      }`
    );
  }
}

async function queryArticle(searchTerm: string, langCode?: string) {
  try {
    const { url, lang } = decideApiDomain(searchTerm, langCode);
    if (lang === "zh") {
      return await fetchArticleByPageId(
        await getClosestTitlePageId(searchTerm, url),
        url
      );
    }
    let article: string | null = await fetchArticle(searchTerm, url);
    if (!article) {
      const closestPageId: string = await getClosestTitlePageId(
        searchTerm,
        url
      );
      article = await fetchArticleByPageId(closestPageId, url);
    }
    return article;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default queryArticle;
