import { useEffect, useState } from "react";

export function useImages(urls: string[]) {
  const [images, setImages] = useState<(HTMLImageElement | undefined)[]>([]);

  useEffect(() => {
    // 画像を非同期に読み込む
    const loadImages = async () => {
      const imgPromises = urls.map((url) => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";  // CORS対策
          img.src = url;
          img.onload = () => resolve(img); // URLをimgPromisesに返す
        });
      });

      const loaded = await Promise.all(imgPromises); // 全てのプロミスが終わるまで待つ
      setImages(loaded);
    };

    loadImages();
  }, [urls]);

  return images;
}
