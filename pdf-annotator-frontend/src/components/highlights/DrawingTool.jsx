import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { Pen, Square, Circle, Eraser, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import ColorPicker from './ColorPicker';

const DrawingTool = ({ onSave }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [drawingMode, setDrawingMode] = useState('pen');
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });

      fabricCanvas.freeDrawingBrush.color = color;
      fabricCanvas.freeDrawingBrush.width = 2;

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (canvas) {
      canvas.freeDrawingBrush.color = color;
    }
  }, [canvas, color]);

  const setTool = (tool) => {
    if (!canvas) return;

    setDrawingMode(tool);

    switch (tool) {
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        break;
      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = 10;
        break;
      case 'rectangle':
      case 'circle':
        canvas.isDrawingMode = false;
        break;
      default:
        canvas.isDrawingMode = false;
    }
  };

  const addShape = (type) => {
    if (!canvas) return;

    let shape;
    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 60,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
      });
    }

    if (shape) {
      canvas.add(shape);
    }
  };

  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  };

  const saveDrawing = () => {
    if (canvas && onSave) {
      const dataURL = canvas.toDataURL();
      onSave(dataURL);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setTool('pen')}
            variant={drawingMode === 'pen' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Pen size={16} />}
          />
          <Button
            onClick={() => {
              setTool('rectangle');
              addShape('rectangle');
            }}
            variant={drawingMode === 'rectangle' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Square size={16} />}
          />
          <Button
            onClick={() => {
              setTool('circle');
              addShape('circle');
            }}
            variant={drawingMode === 'circle' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Circle size={16} />}
          />
          <Button
            onClick={() => setTool('eraser')}
            variant={drawingMode === 'eraser' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Eraser size={16} />}
          />
        </div>

        <ColorPicker selectedColor={color} onColorChange={setColor} />

        <div className="flex gap-2">
          <Button
            onClick={clearCanvas}
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
          >
            Clear
          </Button>
          <Button onClick={saveDrawing} size="sm">
            Save
          </Button>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default DrawingTool;