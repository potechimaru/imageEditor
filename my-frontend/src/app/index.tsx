"use client";

import { useState } from "react";
import "react-color-palette/css";
import "@/css/left_panel.css";

import PromptInput from "@/components/DrawingComponent/PromptInput";
import MenuImportSection from "@/components/Menu/MenuImportSection";
import MenuMaskSection from "@/components/Menu/MenuMaskSection";
import MenuExportSection from "@/components/Menu/MenuExportSection";
import DrawingCanvas from "@/components/DrawingComponent/DrawingCanvas";

const FreeDrawingComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const sectionComponents = [
    () => <MenuImportSection currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} 
          previewUrls={previewUrls} setPreviewUrls={setPreviewUrls}/>,
    () => <MenuMaskSection currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />,
    () => <MenuExportSection currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />,
  ];
  return (
    <div>
      <div className="fixed top-0 left-0 bottom-0 w-1/5 h-full bg-gray-100 border-2 border-gray-200 border-solid">
        {sectionComponents.map((Component, index) => (
          <div key={index} className={index === currentIndex ? '' : 'hidden'}>
            <Component />
          </div>
        ))}
      </div>
        <DrawingCanvas previewUrls={previewUrls} />
      <div>
          <PromptInput></PromptInput>
      </div>
    </div>
    
  );
};

export default FreeDrawingComponent;