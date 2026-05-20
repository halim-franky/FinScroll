import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  text: string;
  url: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove scripts, styles, navs, footers to get clean text
    $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
    
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Unknown Title';
    
    // Extract text primarily from paragraphs and headings
    const paragraphs: string[] = [];
    $('p, h1, h2, h3, h4, li').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) { // filter out tiny noisy elements
        paragraphs.push(text);
      }
    });
    
    const cleanText = paragraphs.join('\n\n');
    
    if (!cleanText) {
      throw new Error("Could not extract meaningful text from this URL.");
    }
    
    return {
      title,
      text: cleanText,
      url
    };
  } catch (error: any) {
    console.error("Scraping error:", error);
    throw new Error(`Scraping failed: ${error.message}`);
  }
}
