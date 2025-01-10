import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { WikipediaArticle } from "@/lib/wikipedia";

interface ArticleCardProps {
  article: WikipediaArticle;
  type: "start" | "goal";
}

export function ArticleCard({ article, type }: ArticleCardProps) {
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
          <p className="text-sm text-gray-600 mb-4">
            {article.extract?.slice(0, 150)}...
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Wikipedia で開く →
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
