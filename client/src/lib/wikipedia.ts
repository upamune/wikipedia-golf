import { HISTORY_SEPARATOR } from "./utils";

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

  // DOMパーサーを作成
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 外部リンクを無効化
  const externalLinks = Array.from(doc.querySelectorAll('a.external.text'));
  for (const link of externalLinks) {
    const span = doc.createElement('span');
    span.className = 'non-game-link';
    span.style.cssText = 'color: #72767d; text-decoration: none; cursor: not-allowed;';
    span.textContent = link.textContent;
    link.replaceWith(span);
  }

  // 座標情報を削除 (position: absoluteを指定しているので非表示に)
  const coordinates = doc.querySelector('span#coordinates');
  coordinates?.remove();

  // リソースのパスを修正
  const processedHtml = doc.body.innerHTML
    // 画像のsrcsetを修正
    .replace(/srcset="\/\//g, 'srcset="https://')
    // 画像のsrcを修正
    .replace(/src="\/\//g, 'src="https://')
    // 画像リンクを無効化
    .replace(/<a[^>]*class="image"[^>]*>(.*?)<\/a>/g, '$1')
    // 生のURLテキストを無効化
    .replace(/(?<!["'])(https?:\/\/[^\s<>"']+)/g, '<span class="non-game-link" style="color: #72767d; text-decoration: none; cursor: not-allowed;">$1</span>')
    // Markdownスタイルのリンクを無効化（@で始まるリンク）
    .replace(/@(https?:\/\/[^\s<]+)/g, '<span class="non-game-link" style="color: #72767d; text-decoration: none; cursor: not-allowed;">@$1</span>')
    // 完全な外部リンクを無効化（http:// や https:// で始まるリンク）
    .replace(/<a[^>]*href="https?:\/\/[^"]*"[^>]*>(.*?)<\/a>/g, '<span class="non-game-link" style="color: #72767d; text-decoration: none; cursor: not-allowed;">$1</span>')
    // 外部リンクを無効化（/wiki/ 以外のパスを持つリンク）
    .replace(/<a[^>]*href="\/(?!wiki\/)[^"]*"[^>]*>(.*?)<\/a>/g, '<span class="non-game-link" style="color: #72767d; text-decoration: none; cursor: not-allowed;">$1</span>')
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
        return 'class="non-game-link" style="color: #72767d; text-decoration: none; cursor: not-allowed;"';
      }

      // 通常のリンクはゲームのURLに変換
      const currentUrl = new URL(window.location.href);
      const [, , start, goal] = currentUrl.pathname.split('/');
      if (!start || !goal) return 'class="non-game-link" style="color: #72767d; text-decoration: none; cursor: not-allowed;"';

      const params = new URLSearchParams(currentUrl.search);
      const currentScore = Number.parseInt(params.get('score') || '0', 10);
      const currentHistory = params.get('history');
      
      const newParams = new URLSearchParams();
      newParams.set('current', title);
      newParams.set('score', (currentScore + 1).toString());
      
      // 履歴を引き継ぎ、新しい記事を追加
      if (currentHistory) {
        const history = decodeURIComponent(currentHistory).split(HISTORY_SEPARATOR);
        const newHistory = [...history, title];
        newParams.set('history', encodeURIComponent(newHistory.join(HISTORY_SEPARATOR)));
      } else {
        newParams.set('history', encodeURIComponent(title));
      }

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
      .wikipedia-content {
        background-color: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        position: relative;
      }

      /* モバイル向けのスクロール領域の視覚的なヒント */
      @media (max-width: 768px) {
        .wikipedia-content::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to top, rgba(255,255,255,0.8), transparent);
          pointer-events: none;
        }
      }

      /* スクロールバーのスタイル */
      .wikipedia-content::-webkit-scrollbar {
        width: 8px;
      }

      .wikipedia-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      .wikipedia-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }

      .wikipedia-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }

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
