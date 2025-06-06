import React from 'react'

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';


interface Props{
    rightPanelCurrentIndex: number;
    setRightPanelCurrentIndex: (index: number) => void;
}

const sections = ['original', 'addMask'] as const;

const MenuOriginalSection = ({rightPanelCurrentIndex, setRightPanelCurrentIndex}: Props) => {

  const handlePrev = () => {
    if(rightPanelCurrentIndex == 0) setRightPanelCurrentIndex(sections.length - 1);
    else setRightPanelCurrentIndex(rightPanelCurrentIndex- 1);
  };
  
  const handleNext = () => {
    if(rightPanelCurrentIndex == sections.length - 1) setRightPanelCurrentIndex(0);
    else setRightPanelCurrentIndex(rightPanelCurrentIndex + 1);
  };
  return (
    <div>
        <div className="flex justify-center m-3">
            <ArrowBackIosNewIcon className="scale-95 mr-4 cursor-pointer" onClick={handlePrev} />
            <p className="text-xl -translate-y-0.5">画像を生成</p>
            <ArrowForwardIosIcon className="scale-95 ml-4 cursor-pointer" onClick={handleNext} />
        </div>
    </div>
  )
}

export default MenuOriginalSection