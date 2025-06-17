import React from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageUploadPreview from '../DrawingComponent/ImageUploadPreview';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  leftPanelCurrentIndex: number;
  setLeftPanelCurrentIndex: (index: number) => void;
  previewUrls: string[];
  setPreviewUrls: Dispatch<SetStateAction<string[]>>;
  setImportedUrls: Dispatch<SetStateAction<string[]>>;
}

const sections = ['import', 'mask', 'export'] as const;

const MenuImportSection = ({ leftPanelCurrentIndex, setLeftPanelCurrentIndex ,previewUrls, setPreviewUrls, setImportedUrls }: Props) => {
  const handlePrev = () => {
    if(leftPanelCurrentIndex == 0) setLeftPanelCurrentIndex(sections.length - 1);
    else setLeftPanelCurrentIndex(leftPanelCurrentIndex - 1);
  };
  const handleNext = () => {
    if(leftPanelCurrentIndex == sections.length - 1) setLeftPanelCurrentIndex(0);
    else setLeftPanelCurrentIndex(leftPanelCurrentIndex + 1);
  };

  return (
    <div>
      <div className="flex justify-center m-3">
        <ArrowBackIosNewIcon className="scale-95 cursor-pointer" onClick={handlePrev} />
        <p className="text-xl -translate-y-0.5 mx-4">インポート</p>
        <ArrowForwardIosIcon className="scale-95 cursor-pointer" onClick={handleNext} />
      </div>
      <ImageUploadPreview
        previewUrls={previewUrls}
        setPreviewUrls={setPreviewUrls}
        onImport={(url) => {
          setImportedUrls((prev) => [...prev, url]);
        }}
      />
    </div>
  );
};

export default MenuImportSection;
