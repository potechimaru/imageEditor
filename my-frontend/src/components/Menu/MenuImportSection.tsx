import React from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageUploadPreview from '../DrawingComponent/ImageUploadPreview';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  previewUrls: string[];
  setPreviewUrls: Dispatch<SetStateAction<string[]>>;
}

const sections = ['import', 'mask', 'export'] as const;

const MenuImportSection = ({ currentIndex, setCurrentIndex ,previewUrls, setPreviewUrls }: Props) => {
  const handlePrev = () => {
    if(currentIndex == 0) setCurrentIndex(sections.length - 1);
    else setCurrentIndex(currentIndex - 1);
  };
  const handleNext = () => {
    if(currentIndex == sections.length - 1) setCurrentIndex(0);
    else setCurrentIndex(currentIndex + 1);
  };

  return (
    <div>
      <div className="flex justify-center m-3">
        <ArrowBackIosNewIcon className="scale-95 cursor-pointer" onClick={handlePrev} />
        <p className="text-xl -translate-y-0.5 mx-4">インポート</p>
        <ArrowForwardIosIcon className="scale-95 cursor-pointer" onClick={handleNext} />
      </div>
      <ImageUploadPreview  previewUrls={previewUrls} setPreviewUrls={setPreviewUrls}/>
    </div>
  );
};

export default MenuImportSection;
