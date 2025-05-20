import React from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageUploadPreview from '../FreeDrawingComponent/ImageUploadPreview';

interface Props {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  previewUrl: string | null;
  setPreviewUrl: (index: string | null) => void;
}

const sections = ['import', 'mask', 'export'] as const;

const MenuImportSection = ({ currentIndex, setCurrentIndex ,previewUrl, setPreviewUrl }: Props) => {
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
      <ImageUploadPreview  previewUrl={previewUrl} setPreviewUrl={setPreviewUrl}/>
    </div>
  );
};

export default MenuImportSection;
