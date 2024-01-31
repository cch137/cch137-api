import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'
import type { AnyNode } from 'cheerio'
import puppeteer from 'puppeteer'
import TurndownService from 'turndown'
// @ts-ignore
import { gfm } from '@joplin/turndown-plugin-gfm'

function joinURL(baseURL: string, relativeURL: string) {
  const urlParts = baseURL.split('/'), relativeParts = relativeURL.split('/');
  urlParts.pop();
  for (const part of relativeParts) {
    if (part === '..') urlParts.pop();
    else if (part !== '.') urlParts.push(part);
  }
  return urlParts.join('/');
}

function parseHtml(html: string | AnyNode | AnyNode[] | Buffer, url: string, textOnly = true) {
  const $ = cheerioLoad(html)
  $('style').remove()
  $('script').remove()
  if (textOnly) {
    $('img').remove()
    $('video').remove()
    $('audio').remove()
    $('canvas').remove()
    $('svg').remove()
  }
  const origin = new URL(url).origin
  const links = new Set<string>()
  $('a').each((_, el) => {
    const href = $(el).attr('href')
    if (typeof href === 'string' && !links.has(href)) {
      if (href.startsWith('/')) links.add(origin + href)
      else if (href.startsWith('#')) links.add(url + href)
      else if (href.startsWith('../') || href.startsWith('./')) links.add(joinURL(url, href))
      else links.add(href)
    }
  })
  // $('a').replaceWith(function () {
  //   return $('<span>').text($(this).prop('innerText') || $(this).text())
  // })
  const td = new TurndownService()
  td.use(gfm)
  const markdown = td.turndown($('body').prop('innerHTML') as string)
  return {
    title: $('title').text() || $('meta[name="title"]').attr()?.content || $('meta[name="og:title"]').attr()?.content,
    description: $('meta[name="description"]').attr()?.content || $('meta[name="og:description"]').attr()?.content,
    links: [...links],
    content: markdown.replace(/<br>/g, '\n').trim(),
  }
}

export async function fetchWebpageWithPupeeter(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return parseHtml(html, url);
}

export async function fetchWebpage(url: string) {
  return parseHtml((await axios.get(url)).data, url);
}
