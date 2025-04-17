import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import PhonicsBoardToolbar from "./PhonicsBoardToolbar";
import { toast } from "@/components/ui/sonner";

// Interfaces
interface StrokeHistory {
  path: any;
  duration: number;
}

export interface CanvasState {
  penSize: "small" | "medium" | "large";
  penColor: string;
  backgroundImage: string | null;
  replaySpeed: number;
  lastStroke: StrokeHistory | null;
  customCursor: string | null;
}

const PhonicsBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeStartTime, setStrokeStartTime] = useState<number | null>(null);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    penSize: "medium",
    penColor: "#00A3FF",
    backgroundImage: null,
    replaySpeed: 1,
    lastStroke: null,
    customCursor: null,
  });

  // Helper to get pen width
  const getPenSizeValue = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small": return 4;
      case "medium": return 10;
      case "large": return 20;
    }
  };

  // Add phonics guide lines
  const addPhonicsLines = (c: fabric.Canvas) => {
    const w = c.getWidth();
    const h = c.getHeight();
    const spacing = 80;
    const solid = "rgba(173,216,230,0.4)";
    const dash  = "rgba(255,182,193,0.4)";

    for (let y = 40; y < h; y += spacing) {
      [0, spacing/2, spacing].forEach((offset, i) => {
        const line = new fabric.Line([0, y + offset, w, y + offset], {
          stroke: i === 1 ? dash : solid,
          strokeWidth: i === 1 ? 1 : 1.5,
          strokeDashArray: i === 1 ? [5,5] : undefined,
          selectable: false,
          evented: false,
          hoverCursor: "default"
        });
        c.add(line);
      });
    }
    c.renderAll();
  };

  const refreshPhonicsLines = (c: fabric.Canvas) => {
    c.getObjects("line").forEach((obj) => c.remove(obj));
    addPhonicsLines(c);
  };

  // INIT: one-time
  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    console.log("Initializing Fabric canvas");
    const c = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: window.innerWidth,
      height: window.innerHeight - 100,
      backgroundColor: "#fff"
    });

    // Force a PencilBrush if missing
    if (!c.freeDrawingBrush) {
      c.freeDrawingBrush = new fabric.PencilBrush(c);
    }
    c.freeDrawingBrush.color = canvasState.penColor;
    c.freeDrawingBrush.width = getPenSizeValue(canvasState.penSize);
    c.freeDrawingBrush.strokeLineCap = "round";
    c.freeDrawingBrush.strokeLineJoin = "round";

    addPhonicsLines(c);

    // Event handlers
    c.on("mouse:down", () => {
      console.log("mouse:down");
      setStrokeStartTime(Date.now());
      setIsDrawing(true);
    });

    c.on("mouse:up", () => {
      console.log("mouse:up");
      setIsDrawing(false);
    });

    c.on("path:created", (e: any) => {
      console.log("path:created", e.path);
      if (strokeStartTime) {
        const duration = Date.now() - strokeStartTime;
        setCanvasState(prev => ({
          ...prev,
          lastStroke: { path: e.path, duration }
        }));
      }
      setStrokeStartTime(null);
    });

    // Resize
    const onResize = () => {
      c.setDimensions({ width: window.innerWidth, height: window.innerHeight - 100 });
      c.renderAll();
      refreshPhonicsLines(c);
    };
    window.addEventListener("resize", onResize);

    setCanvas(c);
    return () => {
      window.removeEventListener("resize", onResize);
      c.dispose();
    };
  }, [canvasRef, canvas, strokeStartTime]);

  // Update brush on pen changes
  useEffect(() => {
    if (!canvas || !canvas.freeDrawingBrush) return;
    console.log("Updating brush settings");
    canvas.freeDrawingBrush.color = canvasState.penColor;
    canvas.freeDrawingBrush.width = getPenSizeValue(canvasState.penSize);
    canvas.isDrawingMode = true;
  }, [canvas, canvasState.penColor, canvasState.penSize]);

  // Background upload
  const handleBackgroundUpload = (url: string) => {
    if (!canvas) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const fibImg = new fabric.Image(img);
      const scale = Math.max(canvas.getWidth()/img.width, canvas.getHeight()/img.height);
      fibImg.scale(scale);
      canvas.setBackgroundImage(fibImg, canvas.renderAll.bind(canvas));
      refreshPhonicsLines(canvas);
      setCanvasState(prev => ({ ...prev, backgroundImage: url }));
      toast.success("Background updated");
    };
    img.onerror = () => toast.error("Background load failed");
    img.src = url;
  };

  // Replay last stroke
  const replayLastStroke = () => {
    if (!canvas || !canvasState.lastStroke) return toast.error("Nothing to replay");
    const { path, duration } = canvasState.lastStroke;
    canvas.remove(path);
    const copy = JSON.parse(JSON.stringify(path));
    const anim = new fabric.Path(copy.path, {
      stroke: copy.stroke,
      strokeWidth: copy.strokeWidth,
      fill: "",
      strokeLineCap: "round",
      strokeLineJoin: "round"
    });
    canvas.add(anim);
    const total = duration / canvasState.replaySpeed;
    const start = Date.now();

    const step = () => {
      const elapsed = Date.now() - start;
      const prog = Math.min(elapsed/total, 1);
      const pts = copy.path.length;
      anim.set({ path: copy.path.slice(0, Math.floor(pts * prog)) });
      canvas.renderAll();
      if (prog < 1) requestAnimationFrame(step);
      else {
        canvas.remove(anim);
        canvas.add(path);
        canvas.renderAll();
        toast.success("Replay done");
      }
    };

    toast("Replaying...");
    requestAnimationFrame(step);
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden">
      <div className="absolute inset-0 pt-[100px]">
        <canvas ref={canvasRef} className="w-full h-full" style={{ pointerEvents: "all" }} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-[100px] z-10">
        <PhonicsBoardToolbar
          canvasState={canvasState}
          onPenSizeChange={size => {
            setCanvasState(s => ({ ...s, penSize: size }));
            toast(`Pen size: ${size}`);
          }}
          onColorChange={color => setCanvasState(s => ({ ...s, penColor: color }))}
          onBackgroundUpload={handleBackgroundUpload}
          onReplayStroke={replayLastStroke}
          onSpeedChange={speed => setCanvasState(s => ({ ...s, replaySpeed: speed }))}
          onCustomCursorChange={cursor => {
            if (canvas) {
              setCanvasState(s => ({ ...s, customCursor: cursor }));
              canvas.defaultCursor = cursor ? `url(${cursor}), auto` : "crosshair";
            }
          }}
        />
      </div>
      <div className="absolute bottom-4 left-4 flex items-center space-x-2 z-10">
        <div className={`h-3 w-3 rounded-full ${isDrawing ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
        <span className="text-sm text-gray-700 opacity-70">{isDrawing ? "Drawing" : "Ready"}</span>
      </div>
    </div>
  );
};

export default PhonicsBoard;
