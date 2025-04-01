import { create } from 'zustand';
import { DrawingState, DrawingTool, Path, Point } from '../types';

interface DrawingStore extends DrawingState {
  currentPath: Path | null; 
  setTool: (tool: DrawingTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  addPoint: (point: Point) => void;
  startPath: () => void;
  endPath: () => void;
  clearCanvas: () => void;
}

export const useStore = create<DrawingStore>((set, get) => ({
  tool: 'pen',
  color: '#000000',
  size: 5,
  paths: [],
  currentPath: null,

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => {
    const validSize = Math.max(1, Math.min(50, size));
    set({ size: validSize });
  },
  
  startPath: () => {
    const { tool, color, size } = get();
    set({
      currentPath: {
        id: Date.now().toString(),
        tool,
        points: [],
        color,
        size
      }
    });
  },
  
  addPoint: (point) => 
    set((state) => ({
      currentPath: state.currentPath 
        ? {
            ...state.currentPath,
            points: [...state.currentPath.points, point]
          }
        : null
    })),
  
  endPath: () => 
    set((state) => ({
      paths: state.currentPath 
        ? [...state.paths, state.currentPath]
        : state.paths,
      currentPath: null
    })),
  
  clearCanvas: () => set({ paths: [], currentPath: null })
}));
