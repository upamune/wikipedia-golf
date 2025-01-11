import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  duration?: number;
}

export function Confetti({ duration = 3000 }: ConfettiProps) {
  useEffect(() => {
    const end = Date.now() + duration;
    const scalar = 10;
    const unicorn = confetti.shapeFromText({ text: '🎉', scalar });

    // 紙吹雪を発生させる関数
    const frame = () => {
      // 左から
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.5 },
        shapes: [unicorn],
      });

      // 右から
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.5 },
        shapes: [unicorn],
      });

      // 中央上から
      confetti({
        particleCount: 2,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0 },
        shapes: [unicorn],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // アニメーションを開始
    frame();

    // クリーンアップ
    return () => {
      confetti.reset();
    };
  }, [duration]);

  return null;
} 