import React, { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react';
import MaskSetting from "@/images/maskSetting.png"
import OriginalSetting from "@/images/OriginalSetting.png"
import Image from 'next/image'

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WithMaskPromptInput from '../DrawingComponent/WithMaskPromptInput';

interface Props{
    previewUrls : string[] | null;
    exportedUrls : string[] | null;
    maskedUrls : string[] | null;
    rightPanelCurrentIndex: number;
    setRightPanelCurrentIndex: (index: number) => void;
    setExportedUrls: Dispatch<SetStateAction<string[]>>;
    generatedPrompt: string;
    setGeneratedPrompt: Dispatch<SetStateAction<string>>;
    userId : string; 
}

const sections = ['original', 'img2img', 'addMask'] as const;

const MenuWithMaskSection = ({previewUrls, exportedUrls, rightPanelCurrentIndex, setRightPanelCurrentIndex, maskedUrls, setExportedUrls, generatedPrompt, setGeneratedPrompt, userId}: Props) => {
  const [isDisplayOriginalSelecter, setIsDisplayOriginalSelecter] = useState(false);
  const [isDisplayMaskSelecter, setIsDisplayMaskSelecter] = useState(false);
  const [isShowImportedImage, setIsShowImportedImage] = useState(false);
  const [isShowExportedImage, setIsShowExportedImage] = useState(false);

  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl]  = useState<string | null>(null);

  const [selectedStyle, setSelectedStyle] = useState("anime style, vibrant colors")
  const [steps, setSteps] = useState(20);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(768);

  const handlePrev = () => {
    if(rightPanelCurrentIndex == 0) setRightPanelCurrentIndex(sections.length - 1);
    else setRightPanelCurrentIndex(rightPanelCurrentIndex- 1);
  };

  const handleNext = () => {
    if(rightPanelCurrentIndex == sections.length - 1) setRightPanelCurrentIndex(0);
    else setRightPanelCurrentIndex(rightPanelCurrentIndex + 1);
  };

  const styles = [
    { label: "リアル系", value: "photorealistic, ultra-detailed" },
    { label: "アニメ調", value: "anime style" },
    { label: "マンガ調", value: "manga style, line art, no panels, no comic layout, no frames, no text bubbles, clean background" },
    { label: "水彩画風", value: "watercolor painting" },
    { label: "油絵風", value: "oil painting" },
  ];

  const handleImageSize = (e: React.ChangeEvent<HTMLInputElement>, type: "width" | "height") => {
      const value = Number(e.target.value);
      if (type === "width") setWidth(value);
      else setHeight(value);
  };

  return (
    <div>
        <div className="flex justify-center m-3">
            <ArrowBackIosNewIcon className="scale-95 mr-4 cursor-pointer" onClick={handlePrev} />
            <p className="text-xl -translate-y-0.5">マスクを加えて生成</p>
            <ArrowForwardIosIcon className="scale-95 ml-4 cursor-pointer" onClick={handleNext} />
        </div>
        <div className='flex flex-col items-center justify-center gap-y-10 my-10'>
            {!originalUrl && (<Image src={OriginalSetting} alt="OriginalSetting" width={150} height={405} onClick = {() => {setIsDisplayOriginalSelecter(!isDisplayOriginalSelecter)}}/>)}
            {originalUrl && (<Image
                src={originalUrl}
                alt="original"
                width={150}
                height={150}
                className="border rounded shadow cursor-pointer hover:opacity-80 transition"
            />)}

            {!maskUrl && (<Image src={MaskSetting} alt="MaskSetting" width={150} height={405} onClick = {() => {setIsDisplayMaskSelecter(!isDisplayMaskSelecter)}}/>)}
            {maskUrl && (<Image
                src={maskUrl}
                alt="mask"
                width={150}
                height={150}
                className="border rounded shadow cursor-pointer hover:opacity-80 transition"
            />)}
            
        </div>
        <div className="flex flex-wrap gap-4 m-4 ">
          {styles.map((style) => (
            <label key={style.value}>
              <input
                type="radio"
                name="style"
                value={style.value}
                checked={selectedStyle === style.value}
                onChange={(e) => setSelectedStyle(e.target.value)}
              />
              {style.label}
            </label>
          ))}
        </div>
        <div className="p-4">
          <label htmlFor="steps" className="block mb-2">
            ステップ数: {steps}
          </label>
          <input
            id="steps"
            type="range"
            min={1}
            max={100}
            step={1}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className='flex flex-col mx-10 mt-5'>
          <label className="block mb-2">
            幅: 
            <input
              type="number"
              value={width}
              className="border px-2 w-2/3"
              onChange={(e) => handleImageSize(e, "width")}
            />
          </label>
          <label className="block mb-2">
            高さ:
            <input
              type="number"
              value={height}
              className="border px-2 w-2/3"
              onChange={(e) => handleImageSize(e, "height")}
            />
          </label>
        </div>
        {isDisplayOriginalSelecter && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border z-50 w-96 p-6 space-y-4">
                <h2 className="text-xl font-medium text-center mb-4">画像の出力元を選択</h2>

                <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
                    onClick = {() => {
                        setIsDisplayOriginalSelecter(!isDisplayOriginalSelecter)
                        setIsShowImportedImage(!isShowImportedImage)
                    }}
                >
                    <span>インポート画像から選択</span>
                </button>

                <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition"
                    onClick = {() => {
                        setIsDisplayOriginalSelecter(!isDisplayOriginalSelecter)
                        setIsShowExportedImage(!isShowExportedImage)
                    }}
                >
                    <span>エクスポート画像から選択</span>
                </button>
                <button
                onClick={() => {
                setIsDisplayOriginalSelecter(false);
                }}
                className="mt-2 px-4 py-1 bg-blue-600 text-white"
                >
                    戻る
                </button>
            </div>
        )}

        {isShowImportedImage && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border z-50 w-96 p-6 space-y-4">
                <h2 className="text-xl font-medium text-center mb-4">元となる画像を選択</h2>
                {/*グリッドレイアウト*/}
                    <div className="grid grid-cols-3 gap-2">
                    {previewUrls?.map((url, i) => (
                        <Image
                        key={i}
                        src={url}
                        alt={`preview-${i}`}
                        width={100}
                        height={100}
                        className="border rounded shadow cursor-pointer hover:opacity-80 transition"
                        onClick={() =>
                            setOriginalUrl(url)
                        }
                        />
                    ))}
                    </div>
                <button
                onClick={() => {
                setIsShowImportedImage(false);
                }}
                className="mt-2 px-4 py-1 bg-blue-600 text-white"
                >
                    閉じる
                </button>
            </div>
        )}

        {isShowExportedImage && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border z-50 w-96 p-6 space-y-4">
                <h2 className="text-xl font-medium text-center mb-4">元となる画像を選択</h2>
                {/*グリッドレイアウト*/}
                    <div className="grid grid-cols-3 gap-2">
                    {exportedUrls?.map((url, i) => (
                        <Image
                        key={i}
                        src={url}
                        alt={`preview-${i}`}
                        width={100}
                        height={100}
                        className="border rounded shadow cursor-pointer hover:opacity-80 transition"
                        onClick={() =>
                            setOriginalUrl(url)
                        }
                        />
                    ))}
                    </div>
                <button
                onClick={() => {
                setIsShowExportedImage(false);
                }}
                className="mt-2 px-4 py-1 bg-blue-600 text-white"
                >
                    閉じる
                </button>
            </div>
        )}

        {isDisplayMaskSelecter && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border z-50 w-96 p-6 space-y-4">
                <h2 className="text-xl font-medium text-center mb-4">マスク画像を選択</h2>
                {/*グリッドレイアウト*/}
                    <div className="grid grid-cols-3 gap-2">
                    {maskedUrls?.map((url, i) => (
                        <Image
                        key={i}
                        src={url}
                        alt={`preview-${i}`}
                        width={100}
                        height={100}
                        className="border rounded shadow cursor-pointer hover:opacity-80 transition"
                        onClick={() =>
                            setMaskUrl(url)
                        }
                        />
                    ))}
                    </div>
                <button
                onClick={() => {
                setIsDisplayMaskSelecter(false);
                }}
                className="mt-2 px-4 py-1 bg-blue-600 text-white"
                >
                    閉じる
                </button>
            </div>
        )}
        <WithMaskPromptInput originalUrl={originalUrl} maskUrl={maskUrl} setExportedUrls={setExportedUrls} steps={steps} width={width} height={height} style={selectedStyle} generatedPrompt={generatedPrompt}
        setGeneratedPrompt={setGeneratedPrompt} userId={userId}/>
    </div>

    
  )
}

export default MenuWithMaskSection