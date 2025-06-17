import React, { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PromptInput from '../DrawingComponent/PromptInput';


interface Props{
    rightPanelCurrentIndex: number;
    setRightPanelCurrentIndex: (index: number) => void;
    setExportedUrls: Dispatch<SetStateAction<string[]>>;
    generatedPrompt: string;
    setGeneratedPrompt: Dispatch<SetStateAction<string>>;
}

const sections = ['original', 'img2img', 'addMask'] as const;

const MenuOriginalSection = ({rightPanelCurrentIndex, setRightPanelCurrentIndex, setExportedUrls, generatedPrompt, setGeneratedPrompt}: Props) => {

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

  const handleImageSize = (e: React.ChangeEvent<HTMLInputElement>, type: "width" | "height") => {
    const value = Number(e.target.value);
    if (type === "width") setWidth(value);
    else setHeight(value);
  };

  const styles = [
    { label: "リアル系", value: "photorealistic, ultra-detailed" },
    { label: "アニメ調", value: "anime style" },
    { label: "マンガ調", value: "manga style, line art, no panels, no comic layout, no frames, no text bubbles, clean background" },
    { label: "水彩画風", value: "watercolor painting" },
    { label: "油絵風", value: "oil painting" },
  ];

  return (
    <div>
        <div className="flex justify-center m-3">
            <ArrowBackIosNewIcon className="scale-95 mr-4 cursor-pointer" onClick={handlePrev} />
            <p className="text-xl -translate-y-0.5">画像を生成</p>
            <ArrowForwardIosIcon className="scale-95 ml-4 cursor-pointer" onClick={handleNext} />
        </div>
        <span className="text-xl font-medium m-2">生成設定</span>
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
        <PromptInput
          setExportedUrls={setExportedUrls}
          steps={steps}
          width={width}
          height={height}
          style={selectedStyle}
          generatedPrompt={generatedPrompt}
          setGeneratedPrompt={setGeneratedPrompt}
        /> {/*プロンプトを入力する欄*/}
    </div>
  )
}

export default MenuOriginalSection