import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { WikipediaArticle } from "@/lib/wikipedia";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: WikipediaArticle;
  type: "start" | "goal";
}

export function ArticleCard({ article, type }: ArticleCardProps) {
  const [isBlurred, setIsBlurred] = useState(type === "goal");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">
              {article.title}
            </CardTitle>
            <Badge variant={type === "start" ? "default" : "destructive"}>
              {type === "start" ? "スタート" : "ゴール"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => type === "goal" && setIsBlurred(false)}
              disabled={type !== "goal"}
              className={cn(
                "transition-all duration-200 w-full text-left",
                type === "goal" && "cursor-pointer",
                isBlurred && "blur-md select-none",
                "bg-transparent border-0 p-0"
              )}
            >
              <p className="text-sm text-gray-600">
                {article.extract?.slice(0, 150)}...
              </p>
            </button>
            <div
              className={cn(
                "transition-all duration-200",
                isBlurred && type === "goal" && "blur-md select-none"
              )}
            >
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Wikipedia で開く →
              </a>
            </div>
          </div>
          {isBlurred && (
            <p className="text-sm text-gray-500 text-center mt-2">
              タップして記事の内容とリンクを表示
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
