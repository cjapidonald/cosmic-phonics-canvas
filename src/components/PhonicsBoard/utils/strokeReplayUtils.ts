
import * as fabric from "fabric";
import { toast } from "@/components/ui/sonner";

// Handle replay of last stroke
export const replayLastStroke = (
  canvas: fabric.Canvas, 
  path: any, 
  duration: number, 
  speed: number
): void => {
  if (!path) {
    toast.error("No stroke to replay");
    return;
  }
  
  const pathCopy = JSON.parse(JSON.stringify(path));
  
  // Remove the original path temporarily for animation
  canvas.remove(path);
  
  // Calculate animation duration based on speed
  const animationDuration = duration / speed;
  
  // Create a temporary path for animation
  const animPath = new fabric.Path(pathCopy.path, {
    stroke: pathCopy.stroke,
    strokeWidth: pathCopy.strokeWidth,
    fill: '',
    strokeLineCap: 'round',
    strokeLineJoin: 'round'
  });
  
  // Add to canvas
  canvas.add(animPath);
  
  // Animate stroke creation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Calculate visible portion of the path
    const points = pathCopy.path.length;
    const visiblePoints = Math.floor(points * progress);
    
    // Update path
    animPath.set({path: pathCopy.path.slice(0, visiblePoints)});
    canvas.renderAll();
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete - restore original path
      canvas.remove(animPath);
      canvas.add(path);
      canvas.renderAll();
      toast.success("Replay complete!");
    }
  };
  
  // Start animation
  toast("Replaying stroke...");
  requestAnimationFrame(animate);
};
