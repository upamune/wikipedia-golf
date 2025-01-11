/// <reference types="vite/client" />

declare module '*.json' {
  const value: {
    articles: Array<{
      title: string;
      views: number;
      rank: number;
    }>;
  };
  export default value;
} 