import React, { useState } from "react";
import { BrandKit } from "../types";
import { ICONS } from "../constants";
// import { analyzeBrandColors } from '../services/geminiService';
import { extractBrandColorsFromImage } from "../services/openaiService";

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(",")[1];
      resolve({ mimeType: file.type, data });
    };
    reader.onerror = (error) => reject(error);
  });
};

const BrandKitAnalyzer: React.FC = () => {
  const [brandKit, setBrandKit] = useState<Partial<BrandKit>>({
    primaryColors: [],
    secondaryColors: [],
    analyzedImages: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5); // Limit to 5 images
      const imagePreviews = files.map((file) => URL.createObjectURL(file));
      setBrandKit((prev) => ({ ...prev, analyzedImages: imagePreviews }));

      setIsLoading(true);
      setError(null);
      try {
        const base64Promises = files.map(fileToBase64);
        const imagesAsBase64 = await Promise.all(base64Promises);

        // OpenAI Vision APIで各画像から色を抽出
        let allColors: string[] = [];
        for (const img of imagesAsBase64) {
          const colors = await extractBrandColorsFromImage(img.data);
          allColors = allColors.concat(colors || []);
        }
        // 重複を除去し、最大10色まで
        const uniqueColors = Array.from(new Set(allColors)).slice(0, 10);
        setBrandKit((prev) => ({
          ...prev,
          primaryColors: uniqueColors.slice(0, 5),
          secondaryColors: uniqueColors.slice(5),
        }));
      } catch (err) {
        setError((err as Error).message || "不明なエラーが発生しました。");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const ColorSwatch: React.FC<{ color: string }> = ({ color }) => (
    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-md">
      <div className="w-8 h-8 rounded-md border-2 border-gray-500" style={{ backgroundColor: color }}></div>
      <span className="font-mono text-sm text-gray-300">{color}</span>
    </div>
  );

  return (
    <div className="p-6 bg-gray-800/50 rounded-lg h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-2">ブランドキット分析</h2>
      <p className="text-gray-400 mb-6">
        ブランドを象徴する画像をアップロードして、AIで自動的にカラーパレットを生成します。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Upload & Images */}
        <div>
          <div className="mb-4">
            <label
              htmlFor="brand-image-upload"
              className="w-full flex justify-center items-center px-6 py-10 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-purple-400 transition-colors"
            >
              <div className="space-y-1 text-center">
                <ICONS.Image className="mx-auto h-12 w-12 text-gray-500" />
                <p className="text-sm text-gray-400">
                  <span className="font-medium text-purple-400">クリックしてアップロード</span> またはドラッグ＆ドロップ
                </p>
                <p className="text-xs text-gray-500">最大5枚の画像をアップロード（PNG, JPG）</p>
              </div>
              <input
                id="brand-image-upload"
                type="file"
                className="sr-only"
                multiple
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {brandKit.analyzedImages?.map((src, index) => (
              <img
                key={index}
                src={src}
                className="w-full h-24 object-cover rounded-md shadow-lg"
                alt={`Brand asset ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="bg-gray-800 p-6 rounded-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg
                className="animate-spin h-8 w-8 text-purple-400 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="font-semibold">ブランドを分析中...</p>
              <p className="text-sm">少々お待ちください。</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 bg-red-500/10 p-4 rounded-md">
              <p className="font-bold">分析に失敗しました</p>
              <p className="text-sm text-center">{error}</p>
            </div>
          ) : (
            <>
              {(brandKit.primaryColors?.length || 0) > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">プライマリーカラー</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {brandKit.primaryColors?.map((color) => (
                      <ColorSwatch key={color} color={color} />
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-4">セカンダリーカラー</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {brandKit.secondaryColors?.map((color) => (
                      <ColorSwatch key={color} color={color} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ICONS.BrandKit className="w-16 h-16 mb-2" />
                  <p className="font-semibold">パレットはここに表示されます</p>
                  <p className="text-sm text-center">画像をアップロードして始めましょう</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandKitAnalyzer;
