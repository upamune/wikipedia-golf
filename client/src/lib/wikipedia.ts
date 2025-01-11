const API_ENDPOINT = "https://ja.wikipedia.org/w/api.php";

export interface WikipediaArticle {
  title: string;
  extract: string;
  url: string;
}

interface WikipediaPage {
  title: string;
  extract: string;
  pageid: number;
}

export async function getRandomArticle(): Promise<WikipediaArticle> {
  const response = await fetch(
    "https://ja.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=1&origin=*"
  );
  const data = await response.json();
  const title = data.query.random[0].title;
  return getArticleByTitle(title);
}

export async function getArticleByTitle(title: string): Promise<WikipediaArticle> {
  const response = await fetch(
    `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(
      title
    )}&exintro=1&explaintext=1&origin=*`
  );
  const data = await response.json();
  const page = Object.values(data.query.pages)[0] as WikipediaPage;
  return {
    title: page.title,
    extract: page.extract,
    url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
  };
}

export async function getArticleContent(title: string): Promise<string> {
  // スタイルとコンテンツを並行して取得
  const [styleResponse, contentResponse] = await Promise.all([
    fetch("https://ja.wikipedia.org/w/load.php?lang=ja&modules=site.styles&only=styles&skin=vector"),
    fetch(
      `https://ja.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(
        title
      )}&prop=text&origin=*`
    ),
  ]);

  const [styles, content] = await Promise.all([
    styleResponse.text(),
    contentResponse.json(),
  ]);

  const html = content.parse.text["*"];

  // リソースのパスを修正
  const processedHtml = html
    // 画像のsrcsetを修正
    .replace(/srcset="\/\//g, 'srcset="https://')
    // 画像のsrcを修正
    .replace(/src="\/\//g, 'src="https://')
    // 画像リンクを無効化
    .replace(/<a[^>]*class="image"[^>]*>(.*?)<\/a>/g, '$1')
    // Wikiリンクを処理
    .replace(/href="\/wiki\/([^"]+)"/g, (match: string, title: string) => {
      // 特殊なリンクは除外
      if (
        title.startsWith('File:') ||
        title.startsWith('Special:') ||
        title.startsWith('Help:') ||
        title.startsWith('Wikipedia:') ||
        title.startsWith('Template:') ||
        title.startsWith('Category:') ||
        title.includes('#')
      ) {
        return 'style="display:none"';
      }

      // 通常のリンクはゲームのURLに変換
      const currentUrl = new URL(window.location.href);
      const [, , start, goal] = currentUrl.pathname.split('/');
      if (!start || !goal) return 'style="display:none"';

      const params = new URLSearchParams(currentUrl.search);
      const currentScore = Number.parseInt(params.get('score') || '0', 10);
      
      const newParams = new URLSearchParams();
      newParams.set('current', title);
      newParams.set('score', (currentScore + 1).toString());

      const newUrl = `/game/${start}/${goal}?${newParams.toString()}`;
      return `href="${newUrl}" class="wiki-link" style="color: #0645ad; text-decoration: none; cursor: pointer;"`;
    })
    // スタイルのパスを修正
    .replace(/url\(\/\//g, 'url(https://');

  // スタイルとコンテンツを結合
  return `
    <style>
      ${styles}
      /* カスタムスタイル */
      .wikipedia-content .mw-parser-output {
        font-size: 16px;
        line-height: 1.6;
        color: #202122;
      }

      /* 画像のスタイル */
      .wikipedia-content img {
        max-width: 100%;
        height: auto;
        margin: 0.5em 0;
        pointer-events: none;
      }

      /* サムネイルのスタイル */
      .wikipedia-content .thumbinner {
        pointer-events: none;
      }

      /* 画像キャプションのスタイル */
      .wikipedia-content .thumbcaption {
        font-size: 0.9em;
        color: #54595d;
        margin-top: 0.5em;
        line-height: 1.4;
        pointer-events: none;
      }

      /* リンクのスタイル */
      .wiki-link {
        color: #0645ad;
        text-decoration: none;
        cursor: pointer;
      }

      .wiki-link:hover {
        text-decoration: underline;
      }

      /* 不要な要素を非表示 */
      .mw-editsection,
      .reference,
      .noprint,
      #toc,
      .mw-jump-link,
      .mw-indicators,
      .mw-references-wrap,
      .navigation-not-searchable,
      .sister-wikipedia,
      .sistersitebox,
      .noexcerpt {
        display: none !important;
      }

      /* 見出しのスタイル */
      .wikipedia-content h2,
      .wikipedia-content h3,
      .wikipedia-content h4 {
        margin: 1em 0 0.5em;
        padding: 0;
        font-weight: bold;
        line-height: 1.3;
        border-bottom: 1px solid #a2a9b1;
      }

      .wikipedia-content h2 { font-size: 1.5em; }
      .wikipedia-content h3 { font-size: 1.3em; }
      .wikipedia-content h4 { font-size: 1.1em; }

      /* リストのスタイル */
      .wikipedia-content ul,
      .wikipedia-content ol {
        margin: 0.3em 0 0.3em 1.6em;
        padding: 0;
        line-height: 1.6;
      }

      .wikipedia-content li { margin-bottom: 0.1em; }
      .wikipedia-content ul { list-style-type: disc; }
      .wikipedia-content ul ul { list-style-type: circle; }
      .wikipedia-content ul ul ul { list-style-type: square; }

      /* 表のスタイル */
      .wikipedia-content table {
        margin: 1em 0;
        border-collapse: collapse;
        background-color: #fff;
      }

      .wikipedia-content th,
      .wikipedia-content td {
        border: 1px solid #a2a9b1;
        padding: 0.4em 0.6em;
      }

      .wikipedia-content th {
        background-color: #eaecf0;
        text-align: center;
      }
    </style>
    <div class="wikipedia-content">
      <div class="mw-parser-output">
        ${processedHtml}
      </div>
    </div>
  `;
}
