import React, { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { drawingsAPI } from '../../services/api/drawings';

/**
 * Annotation layer rendered over a PDF page (fabric.js).
 * Tools: draw (freehand), text (click to add editable text), note (sticky note),
 * eraser (click an object to remove it). Objects are stored in unscaled/base
 * coordinates via setZoom so they stay aligned at any zoom, and the page's canvas
 * JSON is persisted to the backend (debounced) and restored on load.
 */
const DrawingLayer = ({ pdfId, pageNumber, scale, activeTool, color = '#ef4444' }) => {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const saveTimer = useRef(null);
  const loadedKey = useRef(null);

  // Refs so the once-bound fabric event handlers always see current values.
  const pdfIdRef = useRef(pdfId);
  const pageRef = useRef(pageNumber);
  const scaleRef = useRef(scale);
  const toolRef = useRef(activeTool);
  const colorRef = useRef(color);

  const isActive = ['draw', 'text', 'note', 'eraser'].includes(activeTool);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      try {
        await drawingsAPI.save(pdfIdRef.current, pageRef.current, canvas.toJSON());
      } catch (e) {
        console.error('Failed to save drawing:', e);
      }
    }, 700);
  }, []);

  const resizeToPage = useCallback(() => {
    const canvas = fabricRef.current;
    const pageEl = document.querySelector('.react-pdf__Page');
    if (!canvas || !pageEl) return;
    const w = pageEl.clientWidth;
    const h = pageEl.clientHeight;
    if (w && h) {
      canvas.setDimensions({ width: w, height: h });
      canvas.setZoom(scaleRef.current);
      canvas.renderAll();
    }
  }, []);

  // Initialize fabric once, with all event handlers bound to refs.
  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new fabric.Canvas(canvasElRef.current, {
      selection: false,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    canvas.on('path:created', scheduleSave);
    canvas.on('object:modified', scheduleSave);
    canvas.on('text:editing:exited', scheduleSave);

    canvas.on('mouse:down', (opt) => {
      const tool = toolRef.current;
      const pointer = canvas.getPointer(opt.e);

      if (tool === 'eraser') {
        if (opt.target) {
          canvas.remove(opt.target);
          canvas.renderAll();
          scheduleSave();
        }
        return;
      }

      // Don't add a new object when clicking an existing one (allow edit/move).
      if (opt.target) return;

      if (tool === 'text') {
        const text = new fabric.IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 18,
          fill: colorRef.current,
          fontFamily: 'sans-serif',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        scheduleSave();
      } else if (tool === 'note') {
        const note = new fabric.Textbox('Note...', {
          left: pointer.x,
          top: pointer.y,
          width: 160,
          fontSize: 14,
          fill: '#78350f',
          backgroundColor: '#fef3c7',
          padding: 8,
          fontFamily: 'sans-serif',
        });
        canvas.add(note);
        canvas.setActiveObject(note);
        scheduleSave();
      }
    });

    const pageEl = document.querySelector('.react-pdf__Page');
    let ro;
    if (pageEl && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => resizeToPage());
      ro.observe(pageEl);
    }
    resizeToPage();

    return () => {
      if (ro) ro.disconnect();
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep refs current.
  useEffect(() => { pdfIdRef.current = pdfId; }, [pdfId]);
  useEffect(() => { pageRef.current = pageNumber; }, [pageNumber]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => {
    scaleRef.current = scale;
    resizeToPage();
  }, [scale, resizeToPage]);

  // Configure the active tool.
  useEffect(() => {
    toolRef.current = activeTool;
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (activeTool === 'draw') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = 2.5;
      canvas.freeDrawingBrush = brush;
    } else {
      canvas.isDrawingMode = false;
    }
    // Allow selecting/moving/editing objects with text & note tools.
    canvas.selection = activeTool === 'text' || activeTool === 'note';
  }, [activeTool, color]);

  // Load the saved drawing when the PDF or page changes.
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !pdfId) return;
    const key = `${pdfId}:${pageNumber}`;
    if (loadedKey.current === key) return;
    loadedKey.current = key;

    let cancelled = false;
    canvas.clear();
    (async () => {
      try {
        const res = await drawingsAPI.getByPdfId(pdfId);
        const match = (res?.data?.drawings || []).find((d) => d.pageNumber === pageNumber);
        if (match?.data && !cancelled) {
          await canvas.loadFromJSON(match.data);
          canvas.setZoom(scaleRef.current);
          canvas.renderAll();
        }
      } catch (e) {
        console.error('Failed to load drawing:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfId, pageNumber]);

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 20, pointerEvents: isActive ? 'auto' : 'none' }}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
};

export default DrawingLayer;
