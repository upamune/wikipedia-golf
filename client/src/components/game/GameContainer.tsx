import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Share2, Clock } from "lucide-react";
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
import { Confetti } from "./Confetti";
import { ArticleSkeleton } from "./ArticleSkeleton";
import { HISTORY_SEPARATOR } from "@/lib/utils";

export function GameContainer({ startTitle, goalTitle }: { startTitle?: string; goalTitle?: string }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [articleContent, setArticleContent] = useState<string>("");
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // URLからゲームの状態を取得
  const urlParams = new URLSearchParams(window.location.search);
  const currentTitle = urlParams.get('current') ? decodeURIComponent(urlParams.get('current') ?? '') : startTitle;
  const score = Number.parseInt(urlParams.get('score') || '0', 10);
  const historyParam = urlParams.get('history');
  const history: string[] = historyParam 
    ? decodeURIComponent(historyParam).split(HISTORY_SEPARATOR)
    : [];

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
        // 履歴を更新
        const newHistory = [...history, newArticle.title];
        
        // 新しい状態をURLに反映
        const newParams = new URLSearchParams();
        newParams.set('current', newArticle.title);
        newParams.set('score', (score + 1).toString());
        newParams.set('history', encodeURIComponent(newHistory.join(HISTORY_SEPARATOR)));
        setLocation(`/game/${encodeURIComponent(startTitle || '')}/${encodeURIComponent(goalTitle || '')}?${newParams.toString()}`);

        // ゴール判定
        if (newArticle.title === goalTitle) {
          setShowGoalDialog(true);
          setShowConfetti(true);
          // 3秒後にConfettiを非表示にする
          setTimeout(() => setShowConfetti(false), 3000);
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
  }, [startTitle, goalTitle, score, history, toast, setLocation]);

  const handleShareToX = useCallback(() => {
    // 基本的なゲームURLを生成（scoreとcurrentパラメータを除く）
    const baseUrl = new URL(window.location.href);
    baseUrl.search = ''; // クエリパラメータをクリア
    const historyText = history.slice(0, -1).map(title => `→ ${decodeURIComponent(title)}`).join('\n');
    const text = `⛳️ Wikipediaゴルフで${score}手でゴールしました！\n\n🎲 スタート: ${startArticle?.title}\n${historyText}\n✨ ゴール: ${goalArticle?.title}\n\n#Wikipediaゴルフ\n${baseUrl.toString()}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [score, startArticle?.title, goalArticle?.title, history]);

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
                setShowConfetti(true);
                // 3秒後にConfettiを非表示にする
                setTimeout(() => setShowConfetti(false), 3000);
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
  }, [startTitle, goalTitle, currentTitle, toast, generateNewGame]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="h-[calc(100vh-8rem)] overflow-y-auto border rounded-lg bg-white p-8 max-w-4xl mx-auto">
            <ArticleSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showConfetti && <Confetti />}
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
            <div className="border rounded-lg p-4 max-h-[40vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">履歴</span>
              </div>
              <ol className="list-decimal list-inside space-y-1">
                <li className="break-all">{startArticle?.title}</li>
                {history.map((title) => (
                  <li key={`history-${title}`} className="break-all">{decodeURIComponent(title)}</li>
                ))}
              </ol>
            </div>
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

      <header className={`border-b sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-sm' : 'bg-white'}`}>
        <div className={`container mx-auto px-4 ${isScrolled ? 'py-2' : 'py-4'}`}>
          <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 ${isScrolled ? 'h-8' : ''}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`flex items-center gap-2 transition-all duration-300 ${isScrolled ? 'hidden' : ''}`}>
                <Badge className="bg-blue-500">スタート</Badge>
                <span className="font-medium truncate max-w-[200px]">{startArticle?.title}</span>
              </div>
              {currentArticle && currentArticle.title !== startArticle?.title && (
                <div className={`flex items-center gap-2 transition-all duration-300 ${isScrolled ? 'hidden' : ''}`}>
                  <Badge className="bg-green-500">現在</Badge>
                  <span className="font-medium truncate max-w-[200px]">{currentArticle.title}</span>
                </div>
              )}
              <div className={`flex items-center gap-2 transition-all duration-300 ${isScrolled ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
                <Badge className="bg-red-500">ゴール</Badge>
                <span className="font-medium truncate max-w-[200px]">{goalArticle?.title}</span>
              </div>
            </div>
            <div className={`flex items-center gap-4 transition-all duration-300 ${isScrolled ? 'hidden' : ''}`}>
              <span className="font-bold text-lg whitespace-nowrap">スコア: {score} 手</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleNewGame}
                  size="sm"
                  className="hidden sm:flex gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  新しいゲーム
                </Button>
                <Button
                  onClick={handleNewGame}
                  size="icon"
                  title="新しいゲーム"
                  className="sm:hidden"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {startArticle && goalArticle && <ShareButton />}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4">
        <div 
          className="h-[calc(100vh-8rem)] overflow-y-auto border rounded-lg bg-white p-8 max-w-4xl mx-auto wikipedia-content"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Wikipediaの記事を表示するために必要
          dangerouslySetInnerHTML={{ __html: articleContent }}
        />
      </main>
    </div>
  );
}