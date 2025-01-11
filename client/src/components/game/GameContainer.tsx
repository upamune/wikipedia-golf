import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Share2 } from "lucide-react";
import { ShareButton } from "./ShareButton";
import { getRandomArticle, getArticleByTitle, getArticleContent, type WikipediaArticle } from "@/lib/wikipedia";
import { getRandomTopArticle, getWikipediaUrl } from "@/lib/top-articles";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GameContainer({ startTitle, goalTitle }: { startTitle?: string; goalTitle?: string }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [articleContent, setArticleContent] = useState<string>("");
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  // URLからゲームの状態を取得
  const urlParams = new URLSearchParams(window.location.search);
  const currentTitle = urlParams.get('current') ? decodeURIComponent(urlParams.get('current') ?? '') : startTitle;
  const score = Number.parseInt(urlParams.get('score') || '0', 10);

  const [startArticle, setStartArticle] = useState<WikipediaArticle | null>(null);
  const [goalArticle, setGoalArticle] = useState<WikipediaArticle | null>(null);
  const [currentArticle, setCurrentArticle] = useState<WikipediaArticle | null>(null);

  const handleNewGame = useCallback(() => {
    setShowGoalDialog(false);
    generateNewGame();
  }, []);

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

      // 新しいゲームのURLに遷移
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

  const handleArticleChange = useCallback(async (title: string) => {
    try {
      const newArticle = await getArticleByTitle(title);
      if (newArticle) {
        // 新しい状態をURLに反映
        const newParams = new URLSearchParams();
        newParams.set('current', newArticle.title);
        newParams.set('score', (score + 1).toString());
        setLocation(`/game/${encodeURIComponent(startTitle || '')}/${encodeURIComponent(goalTitle || '')}?${newParams.toString()}`);

        // ゴール判定
        if (newArticle.title === goalTitle) {
          setShowGoalDialog(true);
        }
      }
    } catch (error) {
      console.error("Failed to handle navigation:", error);
      toast({
        title: "エラー",
        description: "記事の取得に失敗しました。",
        variant: "destructive",
      });
    }
  }, [startTitle, goalTitle, score, toast, setLocation]);

  const handleShareToX = useCallback(() => {
    // 基本的なゲームURLを生成（scoreとcurrentパラメータを除く）
    const baseUrl = new URL(window.location.href);
    baseUrl.search = ''; // クエリパラメータをクリア
    const text = `⛳️ Wikipediaゴルフで${score}手でゴールしました！\n\n🎲 スタート: ${startArticle?.title}\n✨ ゴール: ${goalArticle?.title}\n\n#Wikipediaゴルフ\n${baseUrl.toString()}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [score, startArticle?.title, goalArticle?.title]);

  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      try {
        if (startTitle && goalTitle) {
          const [start, goal, current] = await Promise.all([
            getArticleByTitle(startTitle),
            getArticleByTitle(goalTitle),
            currentTitle ? getArticleByTitle(currentTitle) : null,
          ]);

          if (start && goal) {
            setStartArticle({
              ...start,
              url: getWikipediaUrl(start.title),
            });
            setGoalArticle({
              ...goal,
              url: getWikipediaUrl(goal.title),
            });
            
            if (current) {
              setCurrentArticle({
                ...current,
                url: getWikipediaUrl(current.title),
              });
              // 現在の記事のコンテンツを取得
              const content = await getArticleContent(current.title);
              setArticleContent(content);

              // 初期ロード時のゴール判定
              if (current.title === goalTitle) {
                setShowGoalDialog(true);
              }
            } else {
              // スタート記事のコンテンツを取得
              const content = await getArticleContent(start.title);
              setArticleContent(content);
              setCurrentArticle({
                ...start,
                url: getWikipediaUrl(start.title),
              });
            }
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
  }, [startTitle, goalTitle, currentTitle, score, toast, generateNewGame]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              ゴール達成！
            </DialogTitle>
            <DialogDescription className="text-lg">
              {score}手でゴールしました！
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-center gap-4">
              <Button onClick={handleNewGame} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                新しいゲーム
              </Button>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleShareToX} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                スコアをXでシェア
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">スタート</Badge>
                <span className="font-medium">{startArticle?.title}</span>
              </div>
              {currentArticle && currentArticle.title !== startArticle?.title && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">現在</Badge>
                  <span className="font-medium">{currentArticle.title}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500">ゴール</Badge>
                <span className="font-medium">{goalArticle?.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg">スコア: {score} 手</span>
              <Button
                onClick={handleNewGame}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                新しいゲーム
              </Button>
              {startArticle && goalArticle && <ShareButton />}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4">
        <div 
          className="h-[calc(100vh-8rem)] overflow-y-auto border rounded-lg bg-white p-8 max-w-4xl mx-auto wikipedia-content"
          dangerouslySetInnerHTML={{ __html: articleContent }}
        />
      </main>
    </div>
  );
}