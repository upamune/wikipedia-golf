import { GameContainer } from "@/components/game/GameContainer";
import { motion } from "framer-motion";

export default function Home({ params }: { params?: { start?: string; goal?: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-2">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wikipedia ゴルフ
          </h1>
          <div className="text-base text-gray-600 max-w-2xl mx-auto break-words">
            スタート記事からゴール記事まで、最小限のクリックでたどり着けるかチャレンジ！
          </div>
        </motion.div>

        <GameContainer
          startTitle={params?.start && decodeURIComponent(params.start)}
          goalTitle={params?.goal && decodeURIComponent(params.goal)}
        />
      </div>
    </div>
  );
}
