
import * as fabric from "fabric";

// Add phonics guide lines to canvas
export const addPhonicsLines = (canvas: fabric.Canvas): void => {
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const lineSpacing = 80; // Spacing between line sets
  const lineColor = 'rgba(173, 216, 230, 0.4)'; // Light blue with opacity
  const dashedLineColor = 'rgba(255, 182, 193, 0.4)'; // Light red with opacity
  
  // Create groups of lines that repeat across the canvas
  for (let y = 40; y < height; y += lineSpacing) {
    // Top solid line
    const topLine = new fabric.Line([0, y, width, y], {
      stroke: lineColor,
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
      hoverCursor: 'default'
    });
    
    // Center dashed line
    const middleLine = new fabric.Line([0, y + lineSpacing/2, width, y + lineSpacing/2], {
      stroke: dashedLineColor,
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      hoverCursor: 'default'
    });
    
    // Bottom solid line
    const bottomLine = new fabric.Line([0, y + lineSpacing, width, y + lineSpacing], {
      stroke: lineColor,
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
      hoverCursor: 'default'
    });
    
    canvas.add(topLine);
    canvas.add(middleLine);
    canvas.add(bottomLine);
  }
  
  canvas.renderAll();
};

// Refresh phonics lines (e.g., after resize)
export const refreshPhonicsLines = (canvas: fabric.Canvas): void => {
  // Remove all existing lines
  canvas.getObjects().forEach((obj) => {
    if (obj.type === 'line') {
      canvas.remove(obj);
    }
  });
  
  // Add new lines
  addPhonicsLines(canvas);
};
