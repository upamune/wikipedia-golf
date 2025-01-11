import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { WikipediaArticle } from "@/lib/wikipedia";

interface ArticleCardProps {
  article: WikipediaArticle;
  type: "start" | "current" | "goal";
  onArticleChange?: (article: WikipediaArticle) => void;
}

export function ArticleCard({ article, type, onArticleChange }: ArticleCardProps) {
  const typeText = {
    start: "スタート",
    current: "現在",
    goal: "ゴール",
  }[type];

  const typeColor = {
    start: "bg-blue-500",
    current: "bg-green-500",
    goal: "bg-red-500",
  }[type];

  const handleLinkClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (onArticleChange && type === "current") {
      onArticleChange(article);
    } else {
      window.open(article.url, "_blank");
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge className={typeColor}>{typeText}</Badge>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="inline-flex items-center hover:text-blue-500"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <CardTitle className="text-xl">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <iframe
          src={article.url}
          className="w-full h-[600px] border-none"
          title={`Wikipedia - ${article.title}`}
          sandbox="allow-same-origin allow-scripts"
        />
      </CardContent>
    </Card>
  );
}
