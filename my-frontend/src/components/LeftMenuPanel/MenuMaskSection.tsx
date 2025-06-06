import React from 'react'
import type { Dispatch } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import type { Stage as KonvaStage } from 'konva/lib/Stage';
import Image from 'next/image';

interface Props {
  leftPanelCurrentIndex: number;
  setLeftPanelCurrentIndex: (index: number) => void;
  stageRef: React.RefObject<KonvaStage | null>;

  maskedUrls: string[];
  setMaskedUrls: Dispatch<React.SetStateAction<string[]>>;

  setSelectedImageIndex: (index: number | null) => void;
}

const sections = ['import', 'mask', 'export'] as const;

const MenuMaskSection =  ({ leftPanelCurrentIndex, setLeftPanelCurrentIndex, stageRef, maskedUrls, setMaskedUrls, setSelectedImageIndex }: Props)=> {

  const handlePrev = () => {
    if(leftPanelCurrentIndex == 0) setLeftPanelCurrentIndex(sections.length - 1);
    else setLeftPanelCurrentIndex(leftPanelCurrentIndex- 1);
  };
  const handleNext = () => {
    if(leftPanelCurrentIndex == sections.length - 1) setLeftPanelCurrentIndex(0);
    else setLeftPanelCurrentIndex(leftPanelCurrentIndex + 1);
  };

  const handleGenerateMask = () => {
    if (!stageRef.current) return;
    setSelectedImageIndex(null);
    
    requestAnimationFrame (() =>{
      if (!stageRef.current) return;
      const maskedUrl = stageRef.current.toCanvas().toDataURL();
      setMaskedUrls((prev) => [...prev, maskedUrl])
    })
  }

  return (
    <div>
      <div className = "flex justify-center m-3">
          <ArrowBackIosNewIcon className="scale-95 mr-4" onClick={handlePrev}/>
          <p className="text-xl -translate-y-0.5">マスク画像</p>
          <ArrowForwardIosIcon className="scale-95 ml-4" onClick={handleNext}/>
      </div>
      <div className="text-center p-4">
        <button className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
        onClick={handleGenerateMask}
        >
          <span>マスク画像を生成</span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {maskedUrls.map((url, i) => (
          <Image
            key={i}
            src={url}
            alt={`masked-${i}`}
            width={100}
            height={100}
            className="border rounded shadow cursor-pointer hover:opacity-80 transition"
          />
        ))}
      </div>
    </div>
  )
}

export default MenuMaskSection