
import { Canvas, Path } from "fabric";

// Define interfaces for our canvas state
export interface StrokeHistory {
  path: any; // Using any for now to avoid TypeScript issues with fabric.js
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

export type PenSize = "small" | "medium" | "large";
