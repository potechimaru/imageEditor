"use client";

import { useState, useRef } from "react";
import "react-color-palette/css";
import "@/css/left_panel.css";

import MenuImportSection from "@/components/LeftMenuPanel/MenuImportSection";
import MenuMaskSection from "@/components/LeftMenuPanel/MenuMaskSection";
import MenuExportSection from "@/components/LeftMenuPanel/MenuExportSection";
import DrawingCanvas from "@/components/DrawingComponent/DrawingCanvas";
import MenuWithMaskSection from "@/components/RightMenuPanel/MenuWithMaskSection";
import MenuOriginalSection from "@/components/RightMenuPanel/MenuOriginalSection";

import type { Stage as KonvaStage } from 'konva/lib/Stage';
import MenuImg2ImgSection from "@/components/RightMenuPanel/MenuImg2ImgSection";

const FreeDrawingComponent = () => {
  const [leftPanelCurrentIndex, setLeftPanelCurrentIndex] = useState(0);  // インポート、エクスポート、マスク画像のメニューを意味する一意の数 
  const [rightPanelCurrentIndex, setRightPanelCurrentIndex] = useState(0);  // 新しく画像を生成、マスク画像から画像を生成、のメニューを意味する一意の数 

  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // インポート画面に表示する画像のURL
  const [importedUrls, setImportedUrls] = useState<string[]>([]); // Canvasに表示する画像のURL
  const [exportedUrls, setExportedUrls] = useState<string[]>([]);
  const [maskedUrls, setMaskedUrls] = useState<string[]>([]);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const stageRef = useRef<KonvaStage | null>(null);
  

  const leftPanelSectionComponents = [
    () => <MenuImportSection leftPanelCurrentIndex={leftPanelCurrentIndex} setLeftPanelCurrentIndex={setLeftPanelCurrentIndex} 
          previewUrls={previewUrls} setPreviewUrls={setPreviewUrls} setImportedUrls={setImportedUrls}/>,
    () => <MenuMaskSection leftPanelCurrentIndex={leftPanelCurrentIndex} setLeftPanelCurrentIndex={setLeftPanelCurrentIndex} stageRef={stageRef}
          maskedUrls={maskedUrls} setMaskedUrls={setMaskedUrls} setSelectedImageIndex={setSelectedImageIndex}/>,
    () => <MenuExportSection leftPanelCurrentIndex={leftPanelCurrentIndex} setLeftPanelCurrentIndex={setLeftPanelCurrentIndex} 
          exportedUrls={exportedUrls} setExportedUrls={setExportedUrls} onImport={(url) => {setImportedUrls((prev) => [...prev, url])}}/>,
  ];

  const rightPanelSectionComponents = [
    () => <MenuOriginalSection rightPanelCurrentIndex={rightPanelCurrentIndex} setRightPanelCurrentIndex={setRightPanelCurrentIndex} setExportedUrls={setExportedUrls} 
          generatedPrompt={generatedPrompt} setGeneratedPrompt={setGeneratedPrompt}/>,
    () => <MenuImg2ImgSection rightPanelCurrentIndex={rightPanelCurrentIndex} setRightPanelCurrentIndex={setRightPanelCurrentIndex} previewUrls={previewUrls} exportedUrls={exportedUrls} setExportedUrls={setExportedUrls}
          generatedPrompt={generatedPrompt} setGeneratedPrompt={setGeneratedPrompt}/>,
    () => <MenuWithMaskSection previewUrls={previewUrls} exportedUrls={exportedUrls} 
          rightPanelCurrentIndex={rightPanelCurrentIndex} setRightPanelCurrentIndex={setRightPanelCurrentIndex} maskedUrls={maskedUrls} setExportedUrls={setExportedUrls}
          generatedPrompt={generatedPrompt} setGeneratedPrompt={setGeneratedPrompt}/>
  ];
  return (
    <div>
      <div className="fixed top-0 left-0 bottom-0 w-1/5 h-full bg-gray-100 border-2 border-gray-200 border-solid z-30 overflow-y-auto">
        {leftPanelSectionComponents.map((Component, index) => (
          <div key={index} className={index === leftPanelCurrentIndex ? '' : 'hidden'}>
            <Component />
          </div>
        ))}
      </div>

        <DrawingCanvas importedUrls={importedUrls} stageRef={stageRef} selectedImageIndex={selectedImageIndex} setSelectedImageIndex={setSelectedImageIndex}/>
      <div className="fixed top-0 right-0 bottom-0 w-1/5 h-full bg-gray-100 border-2 border-gray-200 border-solid z-30 overflow-y-auto">
          {rightPanelSectionComponents.map((Component, index) => (
            <div key={index} className={index === rightPanelCurrentIndex ? '' : 'hidden'}>
              <Component />
            </div>
          ))}
      </div>
    </div>
    
  );
};

export default FreeDrawingComponent;