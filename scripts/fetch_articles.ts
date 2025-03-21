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
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDay = now.getUTCDate();
  const utcHour = now.getUTCHours();

  // 日本時間 (UTC+9) での日付を計算
  let jstDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHour + 9));
  jstDate.setDate(jstDate.getDate() - 1); // 昨日の日付

  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/ja.wikipedia/all-access/${year}/${month}/${day}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WikipediaGolf/1.0'
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
