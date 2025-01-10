const API_ENDPOINT = "https://ja.wikipedia.org/w/api.php";

export interface WikipediaArticle {
  pageid: number;
  title: string;
  extract?: string;
  url: string;
}

export async function getRandomArticle(): Promise<WikipediaArticle> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "random",
    rnnamespace: "0",
    rnlimit: "1",
    origin: "*"
  });

  const response = await fetch(`${API_ENDPOINT}?${params}`);
  const data = await response.json();
  const article = data.query.random[0];

  return {
    pageid: article.id,
    title: article.title,
    url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(article.title)}`
  };
}

export async function getArticleByTitle(title: string): Promise<WikipediaArticle | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles: title,
    prop: "extracts",
    exintro: "true",
    explaintext: "true",
    origin: "*"
  });

  const response = await fetch(`${API_ENDPOINT}?${params}`);
  const data = await response.json();
  const pages = data.query.pages;
  const page = Object.values(pages)[0] as any;

  if (page.missing === "") {
    return null;
  }

  return {
    pageid: page.pageid,
    title: page.title,
    extract: page.extract,
    url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
  };
}
