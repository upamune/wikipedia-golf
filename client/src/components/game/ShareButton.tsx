import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ShareButton() {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URLをコピーしました",
        description: "このゲームのURLがクリップボードにコピーされました。",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "URLのコピーに失敗しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      お題をシェアする
    </Button>
  );
}