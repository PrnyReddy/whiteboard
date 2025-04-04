import { create } from 'zustand';
import { DrawingState, DrawingTool, Path, Point } from '../types';

interface DrawingStore extends DrawingState {
  currentPath: Path | null; 
  history: Path[][];
  redoStack: Path[][]; 
  setTool: (tool: DrawingTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  addPoint: (point: Point) => void;
  startPath: () => void;
  endPath: () => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

export const useStore = create<DrawingStore>((set, get) => ({
  tool: 'pen',
  color: '#000000',
  size: 5,
  paths: [],
  currentPath: null,
  history: [],
  redoStack: [],

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
    set((state) => {
      if (!state.currentPath) return state;
      
      const newHistory = [...state.history, state.paths];
      const newPaths = [...state.paths, state.currentPath];
      
      return {
        paths: newPaths,
        currentPath: null,
        history: newHistory,
        redoStack: []
      };
    }),

  undo: () => 
    set((state) => {
      if (state.history.length === 0) return state;
      
      const newHistory = [...state.history];
      const previousPaths = newHistory.pop();
      const newRedoStack = [...state.redoStack, state.paths];
      
      return {
        paths: previousPaths || [],
        history: newHistory,
        redoStack: newRedoStack,
        currentPath: null
      };
    }),
  
  redo: () => 
    set((state) => {
      if (state.redoStack.length === 0) return state;
      
      const newRedoStack = [...state.redoStack];
      const nextPaths = newRedoStack.pop();
      const newHistory = [...state.history, state.paths];
      
      return {
        paths: nextPaths || [],
        history: newHistory,
        redoStack: newRedoStack,
        currentPath: null
      };
    }),
  
  clearCanvas: () => set({ 
    paths: [], 
    currentPath: null,
    history: [],
    redoStack: []
  })
}));
