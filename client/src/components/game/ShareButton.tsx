import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";

export function ShareButton() {
  const { toast } = useToast();
  const isMobile = useMobile();

  const handleShare = async () => {
    const baseUrl = new URL(window.location.href);
    baseUrl.search = '';

    try {
      await navigator.clipboard.writeText(baseUrl.toString());
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
      size={isMobile ? "icon" : "sm"}
    >
      <Share2 className="h-5 w-5" />
      {!isMobile && "お題をシェアする"}
    </Button>
  );
}
