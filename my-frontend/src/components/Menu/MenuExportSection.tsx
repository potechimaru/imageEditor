import React from 'react'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface Props {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const sections = ['import', 'mask', 'export'] as const;

const MenuExportSection = ({ currentIndex, setCurrentIndex }: Props)=> {

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
        <div className = "flex justify-center m-3">
            <ArrowBackIosNewIcon className="scale-95 mr-4" onClick={handlePrev}/>
            <p className="text-xl -translate-y-0.5">エクスポート</p>
            <ArrowForwardIosIcon className="scale-95 ml-4" onClick={handleNext}/>
        </div>
    </div>
  )
}

export default MenuExportSection