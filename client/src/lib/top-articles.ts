import topArticlesJson from '@/../../data/top-articles.json';

export interface TopArticle {
  title: string;
  views: number;
  rank: number;
}

export interface TopArticlesResponse {
  articles: TopArticle[];
}

export function getRandomTopArticle(): TopArticle {
  const articles = (topArticlesJson as TopArticlesResponse).articles;
  const randomIndex = Math.floor(Math.random() * articles.length);
  return articles[randomIndex];
}

export function getWikipediaUrl(title: string): string {
  return `https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}`;
} 