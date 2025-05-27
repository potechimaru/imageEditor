import React from 'react'
import { useState, useEffect, useRef } from "react";
import { useImages } from '../Hooks/UseImages';
import { Stage, Layer, Line } from "react-konva";
import { Image as KonvaImage } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { ColorPicker, useColor } from "react-color-palette";
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import "react-color-palette/css";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import DownloadIcon from "@mui/icons-material/Download";
import LineWeightIcon from "@mui/icons-material/LineWeight";
import RefreshIcon from "@mui/icons-material/Refresh";
import UndoIcon from "@mui/icons-material/Undo";
import { LuPencil, LuEraser, LuPalette } from "react-icons/lu";

import "@/css/style.css";

type LineData = {
  tool: string;
  points: number[];
  color: string;
  strokeWidth: number;
};

interface Props {
  previewUrls: string[];
}

const DrawingCanvas = ({ previewUrls }: Props) => {

    const images = useImages(previewUrls);

    const [tool, setTool] = useState("pen");
    const [lines, setLines] = useState<LineData[]>([]);
    const isDrawing = useRef(false);
  
    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
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
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (!position) return;

    const lastLine = lines[lines.length - 1];
    const updatedPoints = lastLine.points.concat([position.x, position.y]);
    const updatedLine = { ...lastLine, points: updatedPoints };
    setLines([...lines.slice(0, -1), updatedLine]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    setLines([
      ...lines,
      {
        tool,
        points: [point.x, point.y],
        color: color.hex,
        strokeWidth: lineWeight,
      },
    ]);
    isDrawing.current = true;
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
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
    setLines(lines.slice(0, lines.length - 1));
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
  const handleCloseMenuItems = () => {
    setAnchorEl(null);
  };

  const [lineWeight, setLineWeight] = useState(5);
  const handleChangeLineWeight = (weight: number) => {
    handleCloseMenuItems();
    setLineWeight(weight);
  };

  const [color, setColor] = useColor("#000000");
  const [isDisplayColorPicker, setIsDisplayColorPicker] = useState(false);
  const onClickDisplayColorPicker = () => {
    setIsDisplayColorPicker(!isDisplayColorPicker);
  };
  useEffect(() => {
    setColor(color);
  }, [color, setColor]);

  const onClickResetCanvas = () => {
    setLines([]);
    setIsDisplayColorPicker(false);
  };

  const stageRef = useRef<KonvaStage | null>(null);
  const onClickDownloadCanvas = () => {
    if (stageRef.current) {
      const a = document.createElement("a");
      a.href = stageRef.current.toCanvas().toDataURL();
      a.download = "canvas.png";
      a.click();
    }
    setIsDisplayColorPicker(false);
  };

  return (
    <div className="free-drawing-container">
        <Stage
          style={{ border: "1px solid black", borderRadius: "32px" }}
          width={window.innerWidth * 0.6}
          height={window.innerHeight * 0.6}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={stageRef}
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
                  draggable
                />
              ) : null
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
        <div className="toolbar">
          <Tooltip title="戻す" placement="top">
            <IconButton onClick={handleUndo}>
              <UndoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="ペン" placement="top">
            <IconButton
              onClick={() => onClickChangeTool("pen")}
              color={tool === "pen" ? "primary" : "default"}
            >
              <LuPencil />
            </IconButton>
          </Tooltip>
          <Tooltip title="消しゴム" placement="top">
            <IconButton
              onClick={() => onClickChangeTool("eraser")}
              color={tool === "eraser" ? "primary" : "default"}
            >
              <LuEraser />
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
              <LineWeightIcon />
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
          <Tooltip title="ペンの色" placement="top">
            <IconButton
              onClick={onClickDisplayColorPicker}
              color={isDisplayColorPicker ? "primary" : "default"}
            >
              <LuPalette />
            </IconButton>
          </Tooltip>
          <Tooltip title="描画のリセット" placement="top">
            <IconButton onClick={onClickResetCanvas}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="ダウンロード" placement="top">
            <IconButton onClick={onClickDownloadCanvas}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div className="tool-info">
          <Typography>現在のツール：{tool === "pen" ? "ペン" : "消しゴム"}</Typography>
          <Typography>ツールの太さ：{lineWeight}</Typography>
          {tool === "pen" && (
              <Typography
              component="div"
              style={{ display: "flex", alignItems: "center" }}
              >
              ペンの色：
              <Box
                  sx={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: color.hex,
                  border: "1px solid black",
                  marginRight: "4px",
                  }}
              />
              {color.hex}
              </Typography>
          )}
          </div>
        <div style={{ display: isDisplayColorPicker ? "block" : "none" }} className = "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" >
          <ColorPicker hideInput={["rgb", "hsv"]} color={color} onChange={setColor} />
        </div>
    </div>
  )
}

export default DrawingCanvas