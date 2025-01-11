import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { ArticleCard } from "./ArticleCard";
import { ShareButton } from "./ShareButton";
import { getRandomArticle, getArticleByTitle, type WikipediaArticle } from "@/lib/wikipedia";
import { getRandomTopArticle, getWikipediaUrl } from "@/lib/top-articles";
import { useLocation } from "wouter";

export function GameContainer({ startTitle, goalTitle }: { startTitle?: string; goalTitle?: string }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [startArticle, setStartArticle] = useState<WikipediaArticle | null>(null);
  const [goalArticle, setGoalArticle] = useState<WikipediaArticle | null>(null);

  const generateNewGame = useCallback(async () => {
    setLoading(true);
    try {
      const start = await getRandomArticle();
      const goalFromTop = getRandomTopArticle();
      
      // 記事の詳細情報を取得
      const goal = await getArticleByTitle(goalFromTop.title);
      if (!goal) {
        throw new Error("目標記事の取得に失敗しました");
      }

      setStartArticle(start);
      setGoalArticle({
        ...goal,
        url: getWikipediaUrl(goal.title)
      });
      setLocation(`/game/${encodeURIComponent(start.title)}/${encodeURIComponent(goal.title)}`);
    } catch (error) {
      toast({
        title: "エラー",
        description: "記事の取得に失敗しました。再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, setLocation]);

  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      try {
        if (startTitle && goalTitle) {
          const [start, goal] = await Promise.all([
            getArticleByTitle(startTitle),
            getArticleByTitle(goalTitle)
          ]);
          if (start && goal) {
            setStartArticle({
              ...start,
              url: getWikipediaUrl(start.title)
            });
            setGoalArticle({
              ...goal,
              url: getWikipediaUrl(goal.title)
            });
          } else {
            throw new Error("記事が見つかりません");
          }
        } else {
          await generateNewGame();
        }
      } catch (error) {
        toast({
          title: "エラー",
          description: "記事の取得に失敗しました。再度お試しください。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [startTitle, goalTitle, toast, generateNewGame]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4 mb-8">
        <Button
          onClick={generateNewGame}
          size="lg"
          className="gap-2 text-lg px-8 py-6"
        >
          <RefreshCw className="h-5 w-5" />
          新しいゲームを始める
        </Button>
        {startArticle && goalArticle && <ShareButton />}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {startArticle && <ArticleCard article={startArticle} type="start" />}
        {goalArticle && <ArticleCard hideUrl article={goalArticle} type="goal" />}
      </div>
    </div>
  );
}