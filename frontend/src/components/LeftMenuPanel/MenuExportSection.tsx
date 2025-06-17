import React from 'react'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import type { Dispatch } from 'react';
import Image from 'next/image';

interface Props {
  leftPanelCurrentIndex: number;
  setLeftPanelCurrentIndex: (index: number) => void;
  exportedUrls: string[];
  setExportedUrls: Dispatch<React.SetStateAction<string[]>>;
  onImport: (url: string) => void;
}

const sections = ['import', 'mask', 'export'] as const;

const MenuExportSection = ({ leftPanelCurrentIndex, setLeftPanelCurrentIndex, exportedUrls, onImport }: Props) => {

  const handlePrev = () => {
    if (leftPanelCurrentIndex === 0) setLeftPanelCurrentIndex(sections.length - 1);
    else setLeftPanelCurrentIndex(leftPanelCurrentIndex - 1);
  };

  const handleNext = () => {
    if (leftPanelCurrentIndex === sections.length - 1) setLeftPanelCurrentIndex(0);
    else setLeftPanelCurrentIndex(leftPanelCurrentIndex + 1);
  };

  return (
    <div>
      <div className="flex justify-center m-3">
        <ArrowBackIosNewIcon className="scale-95 mr-4 cursor-pointer" onClick={handlePrev} />
        <p className="text-xl -translate-y-0.5">エクスポート</p>
        <ArrowForwardIosIcon className="scale-95 ml-4 cursor-pointer" onClick={handleNext} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {exportedUrls.map((url, i) => (
          <Image
            key={i}
            src={url}
            alt={`exported-${i}`}
            width={100}
            height={100}
            className="border rounded shadow"
            onClick={() => onImport(url)}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuExportSection;
