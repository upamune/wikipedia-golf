#!/usr/bin/env bun

interface PageViewResponse {
  items: {
    articles: {
      article: string;
      views: number;
      rank: number;
    }[];
  }[];
}

interface Article {
  title: string;
  views: number;
  rank: number;
}

// 除外するタイトルのリスト
const EXCLUDED_TITLES = new Set([
  "特別:検索",
  "メインページ",
  "特別:最近の更新"
]);

async function fetchTopArticles() {
  const date = new Date();
  date.setDate(date.getDate() - 1); // 昨日の日付を取得
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/ja.wikipedia/all-access/${year}/${month}/${day}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WikipediaGolf/1.0 (https://github.com/upamune/wikipedia-golf; upamune@example.com)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as PageViewResponse;
    const articles = data.items[0].articles
      .filter(article => !EXCLUDED_TITLES.has(article.article))
      .slice(0, 300);
    
    const formattedArticles: Article[] = articles.map((article, index) => ({
      title: article.article,
      views: article.views,
      rank: index + 1
    }));

    console.log(JSON.stringify({ articles: formattedArticles }, null, 2));
    
  } catch (error) {
    console.error('Error fetching top articles:', error);
    process.exit(1);
  }
}

fetchTopArticles();
