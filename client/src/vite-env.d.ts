/// <reference types="vite/client" />

declare module '*.json' {
  const value: {
    articles: Array<{
      title: string;
      url: string;
      views: number;
      rank: number;
    }>;
  };
  export default value;
} 