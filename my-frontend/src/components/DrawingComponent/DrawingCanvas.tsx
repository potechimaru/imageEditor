import React from 'react'
import { useState, useEffect, useRef} from "react";
import { useImages } from '../Hooks/UseImages';
import { Stage, Layer, Line } from "react-konva";
import { Image as KonvaImage } from "react-konva";
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { KonvaEventObject } from "konva/lib/Node";
import { ColorPicker, useColor } from "react-color-palette";
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import "react-color-palette/css";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";

import DownloadIcon from "@mui/icons-material/Download";
import LineWeightIcon from "@mui/icons-material/LineWeight";
import RefreshIcon from "@mui/icons-material/Refresh";
import UndoIcon from "@mui/icons-material/Undo";
import AdsClickIcon from '@mui/icons-material/AdsClick';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { LuPencil, LuEraser, LuPalette } from "react-icons/lu";

import "@/css/style.css";

type LineData = {
  tool: string;
  points: number[];
  color: string;
  strokeWidth: number;
};

interface Props {
  importedUrls: string[];
  stageRef: React.RefObject<KonvaStage | null>;
  selectedImageIndex: number | null
  setSelectedImageIndex:(index: number | null) => void 
}

const DrawingCanvas = ({ importedUrls, stageRef, selectedImageIndex, setSelectedImageIndex }: Props) => {

  const images = useImages(importedUrls);
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState<LineData[]>([]);

  const isDrawing = useRef(false);
  const imageRefs = useRef<(Konva.Image | null)[]>([]);

  const [canvasWidth, setCanvasWidth] = useState<number | ''>(512);
  const [canvasHeight, setCanvasHeight] = useState<number | ''>(512); 
  const [showCanvasSizeForm, setShowCanvasSizeForm] = useState(false);
  const [isFitCanvasToImage, setIsFitCanvasToImage] = useState(false);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {

    //Canvas内において画像外ではないところをクリックしたらTransformの選択を解除
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedImageIndex(null);
    }

    if (tool === "drag") return;

    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (!position) return;

    isDrawing.current = true;
    setLines([
      ...lines,
      {
        tool,
        points: [position.x, position.y],
        color: color.hex,
        strokeWidth: lineWeight,
      },
    ]);
  };


  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current || tool === "drag") return;
    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (!position) return;

    const lastLine = lines[lines.length - 1];
    const updatedPoints = lastLine.points.concat([position.x, position.y]);
    const updatedLine = { ...lastLine, points: updatedPoints };
    setLines([...lines.slice(0, -1), updatedLine]);
  };

  const handleMouseUp = () => isDrawing.current = false;
  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    if (tool === "drag") return;
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;
    setLines([...lines, { tool, points: [point.x, point.y], color: color.hex, strokeWidth: lineWeight }]);
    isDrawing.current = true;
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    if (tool === "drag") return;
    e.evt.preventDefault();
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;
    const lastLine = lines[lines.length - 1];
    const updatedPoints = lastLine.points.concat([point.x, point.y]);
    const updatedLine = { ...lastLine, points: updatedPoints };
    setLines([...lines.slice(0, -1), updatedLine]);
  };

  const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    isDrawing.current = false;
  };

  const handleUndo = () => {
    setLines(lines.slice(0, -1));
    setIsDisplayColorPicker(false);
  };

  const onClickChangeTool = (tool: string) => {
    setTool(tool);
    setIsDisplayColorPicker(false);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpenMenuItems = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setIsDisplayColorPicker(false);
  };
  const handleCloseMenuItems = () => setAnchorEl(null);
  const [lineWeight, setLineWeight] = useState(5);
  const handleChangeLineWeight = (weight: number) => {
    handleCloseMenuItems();
    setLineWeight(weight);
  };

  const [color, setColor] = useColor("#000000");
  const [isDisplayColorPicker, setIsDisplayColorPicker] = useState(false);
  const onClickDisplayColorPicker = () => setIsDisplayColorPicker(!isDisplayColorPicker);
  useEffect(() => setColor(color), [color, setColor]);

  const onClickResetCanvas = () => {
    setLines([]);
    setIsDisplayColorPicker(false);
  };

  const onClickDownloadCanvas = () => {
  setSelectedImageIndex(null);

  // 1描画フレーム待ってからダウンロード処理を実行
  // Transformによる枠を取り除いてからダウンロード
  requestAnimationFrame(() => {
    if (stageRef.current) {
      const a = document.createElement("a");
      a.href = stageRef.current.toCanvas().toDataURL();
      a.download = "canvas.png";
      a.click();
    }
  });

  setIsDisplayColorPicker(false);
};

  const onClickChangeCanvasSize = () => {
    setSelectedImageIndex(null);
    setShowCanvasSizeForm(true);
  };

  //画像をキャンバスサイズに合わせる時に使用する
  useEffect(() => {
    if (isFitCanvasToImage && imageRefs.current.length > 0) {
      let maxWidth = 0;
      let maxHeight = 0;
      let maxIndex = -1;

      console.log(imageRefs.current[0]);

      //一番大きい画像を探す
      imageRefs.current.forEach((node, i) => {
        if (node) {
          const rect = node.getClientRect();  // 画像のスケールを変えたり回転させたりすることに対応
          const area = rect.width * rect.height;
          if (area > maxWidth * maxHeight) {
            maxWidth = rect.width;
            maxHeight = rect.height;
            maxIndex = i;
          }
          console.log("通ったよ");
        }
      });

      const maxNode = imageRefs.current[maxIndex];
      if (maxIndex !== -1 && maxNode) {
        const rect = maxNode.getClientRect();

        setCanvasWidth(Math.ceil(rect.width));
        setCanvasHeight(Math.ceil(rect.height));

        const stageWidth = Math.ceil(rect.width);
        const x = (stageWidth - rect.width) / 2;

        maxNode.position({ x, y: 0 });
        maxNode.getLayer()?.batchDraw();  //即時に描画をする
      }

      setIsFitCanvasToImage(false);
    }
  }, [isFitCanvasToImage, images]);

  useEffect(() => {
    if (images.length > 0) {
      imageRefs.current = Array(images.length)
        .fill(null)
        .map((_, i) => imageRefs.current[i] || null);
    }
  }, [images]);


  return (
    <div className="">
      <div className="fixed top-0 left-0 w-full h-20 bg-blue-600 z-20">
        <div className="flex justify-center h-full gap-10">
          <Tooltip title="画像をドラッグ" placement="top">
            <IconButton onClick={() => onClickChangeTool("drag")}>
              <AdsClickIcon className={`scale-150 ${tool === "drag" ? "text-blue-300" : "text-white"}`} />
            </IconButton>
          </Tooltip>
          <Tooltip title="戻す" placement="top">
            <IconButton onClick={handleUndo}>
              <UndoIcon  className='text-white scale-150'/>
            </IconButton>
          </Tooltip>
          <Tooltip title="ペン" placement="top">
            <IconButton onClick={() => onClickChangeTool("pen")}>
              <LuPencil className={`scale-150 ${tool === "pen" ? "text-blue-300" : "text-white"}`} />
            </IconButton>
          </Tooltip>
          <Tooltip title="消しゴム" placement="top">
            <IconButton
              onClick={() => onClickChangeTool("eraser")}
            >
              <LuEraser className={`scale-150 ${tool === "eraser" ? "text-blue-300" : "text-white"}`} />
            </IconButton>
          </Tooltip>
          <Tooltip title="ペン / 消しゴムの太さ" placement="top">
            <IconButton
              id="line-weight-button"
              aria-controls={open ? "line-weight-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleOpenMenuItems}
              color={anchorEl ? "primary" : "default"}
            >
              <LineWeightIcon  className='text-white scale-150'/>
            </IconButton>
          </Tooltip>
          <Menu
            id="line-weight-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenuItems}
            MenuListProps={{
              "aria-labelledby": "line-weight-button",
              style: {
                display: "flex",
                flexDirection: "row",
              },
            }}
            className="menu-list"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((weight) => (
              <MenuItem key={weight} onClick={() => handleChangeLineWeight(weight)}>
                {weight}
              </MenuItem>
            ))}
          </Menu>
          {showCanvasSizeForm && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border p-4 z-50">
              <label className="block mb-2">
                Width: 
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCanvasWidth(val === '' ? '' : Number(val));
                  }}
                  className="border px-2"
                />
              </label>
              <label className="block mb-2">
                Height: 
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCanvasHeight(val === '' ? '' : Number(val));
                  }}
                  className="border px-2"
                />
              </label>
              <label className="block mb-2">
                  画像にキャンバスを合わせる
                  <input type="checkbox" onChange={(e) =>{
                    setIsFitCanvasToImage((e.target.checked))
                  }}/>
              </label>
              <button
                onClick={() => {
                  if (canvasWidth === '') setCanvasWidth(0);
                  if (canvasHeight === '') setCanvasHeight(0);
                  setShowCanvasSizeForm(false);
                }}
                className="mt-2 px-4 py-1 bg-blue-600 text-white"
              >
                閉じる
              </button>
            </div>
          )}

            <Tooltip title="ペンの色" placement="top">
              <IconButton
                onClick={onClickDisplayColorPicker}
              >
                <LuPalette className={`scale-150 ${isDisplayColorPicker ? "text-blue-300" : "text-white"}`} />
              </IconButton>
            </Tooltip>
            <Tooltip title="描画のリセット" placement="top">
              <IconButton onClick={onClickResetCanvas}>
                <RefreshIcon className='text-white scale-150'/>
              </IconButton>
            </Tooltip>
            <Tooltip title="ダウンロード" placement="top">
              <IconButton onClick={onClickDownloadCanvas}>
                <DownloadIcon className='text-white scale-150'/>
              </IconButton>
            </Tooltip>
            <Tooltip title="キャンバスサイズ" placement="top">
              <IconButton onClick={onClickChangeCanvasSize}>
                <CheckBoxOutlineBlankIcon className='text-white scale-150'/>
              </IconButton>
            </Tooltip>
          </div>
        </div>
        {/* Canvas本体 = Stage */}
        <Stage
            style={{ border: "1px solid black" }}
            width={typeof canvasWidth === 'number' ? canvasWidth : 512}
            height={typeof canvasHeight === 'number' ? canvasHeight : 512}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            ref={stageRef}
            className="mt-32"
          >
          <Layer>
            {/* 画像の表示（ドラッグ可能） */}
            {images.map((img, i) =>
            img ? (
              <KonvaImage
                key={i}
                image={img}
                x={50 + i * 40}
                y={50 + i * 40}
                draggable={tool === "drag"}
                onClick={() => {
                  //if(tool !== "drag") return;
                  setSelectedImageIndex(i)}}
                ref={(node) => {
                  imageRefs.current[i] = node;
                }}
              />
            ) : null
            )}

            {selectedImageIndex !== null && (
              <Transformer
                ref={(node) => {
                  if (node && imageRefs.current[selectedImageIndex]) {
                    node.nodes([imageRefs.current[selectedImageIndex]]);
                    node.getLayer()?.batchDraw(); // リフレッシュ
                  }
                }}
                rotateEnabled={true}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              />
            )}


            {/* 描画ラインの描画 */}
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>

        </Stage>
      <div style={{ display: isDisplayColorPicker ? "block" : "none" }} className = "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" >
        <ColorPicker hideInput={["rgb", "hsv"]} color={color} onChange={setColor} />
      </div>
    </div>
  )
}

export default DrawingCanvas