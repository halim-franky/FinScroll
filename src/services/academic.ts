import { ingestDocuments } from "./ingestion";

export interface AcademicPaper {
  title: string;
  abstract: string;
  url: string;
  source: string;
}

/**
 * Service to interface with leading academic databases: Springer Nature and Elsevier Scopus.
 * Employs secure, fallback-safe API queries to retrieve peer-reviewed research.
 */
export class AcademicService {
  private static SPRINGER_KEY = process.env.SPRINGER_API_KEY || "";
  private static SCOPUS_KEY = process.env.SCOPUS_API_KEY || "";

  /**
   * Searches and retrieves doomscrolling/digital wellness research from Springer Nature.
   */
  static async fetchSpringerPapers(query: string = "doomscrolling"): Promise<AcademicPaper[]> {
    if (!this.SPRINGER_KEY) {
      console.warn("Springer Nature API Key not configured. Skipping...");
      return [];
    }

    try {
      const url = `http://api.springernature.com/meta/v1/json?q=keyword:${encodeURIComponent(query)}&api_key=${this.SPRINGER_KEY}`;
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      
      if (!response.ok) {
        throw new Error(`Springer Nature API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const records = data.records || [];

      return records.slice(0, 3).map((record: any) => ({
        title: record.title || "Springer Academic Research",
        abstract: record.abstract || record.paragraphs?.join("\n") || "Abstract unavailable.",
        url: record.url?.[0]?.value || "https://link.springer.com",
        source: "springer.com"
      }));
    } catch (err: any) {
      console.error("Error fetching from Springer Nature:", err.message);
      return [];
    }
  }

  /**
   * Searches and retrieves dense research abstracts from Elsevier Scopus.
   */
  static async fetchScopusPapers(query: string = "doomscrolling"): Promise<AcademicPaper[]> {
    if (!this.SCOPUS_KEY) {
      console.warn("Elsevier Scopus API Key not configured. Skipping...");
      return [];
    }

    try {
      const url = `https://api.elsevier.com/content/search/scopus?query=TITLE-ABS-KEY(${encodeURIComponent(query)})&apiKey=${this.SCOPUS_KEY}`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "X-ELS-APIKey": this.SCOPUS_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Elsevier Scopus API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const entries = data["search-results"]?.entry || [];

      return entries.slice(0, 3).map((entry: any) => {
        const scopusLink = entry.link?.find((l: any) => l["@ref"] === "scopus" || l["@ref"] === "self")?.["@href"];
        return {
          title: entry["dc:title"] || "Scopus Indexed Study",
          abstract: entry["dc:description"] || "Abstract summary indexed in Scopus.",
          url: scopusLink || "https://www.scopus.com",
          source: "scopus.com"
        };
      });
    } catch (err: any) {
      console.error("Error fetching from Elsevier Scopus:", err.message);
      return [];
    }
  }

  /**
   * Ingests papers fetched from external academic search APIs directly into Pinecone.
   */
  static async syncAcademicResources(query: string = "doomscrolling"): Promise<{ success: boolean; chunks: number; sources: string[] }> {
    const papers: AcademicPaper[] = [];
    const sources: string[] = [];

    // 1. Trigger parallel queries to academic endpoints
    const [springerResults, scopusResults] = await Promise.all([
      this.fetchSpringerPapers(query),
      this.fetchScopusPapers(query)
    ]);

    papers.push(...springerResults, ...scopusResults);

    if (papers.length === 0) {
      return { success: false, chunks: 0, sources: [] };
    }

    let totalChunks = 0;

    // 2. Ingest each research paper as a grounded document
    for (const paper of papers) {
      try {
        const result = await ingestDocuments([paper.abstract], {
          source: paper.url,
          title: paper.title,
          publisher: paper.source
        });
        if (result.success) {
          totalChunks += result.chunksCreated;
          sources.push(paper.source);
        }
      } catch (err: any) {
        console.error(`Failed to ingest paper "${paper.title}":`, err.message);
      }
    }

    return {
      success: true,
      chunks: totalChunks,
      sources: Array.from(new Set(sources))
    };
  }
}
