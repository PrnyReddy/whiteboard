import { create } from 'zustand';
import { DrawingState, DrawingTool, Path, Point, ShapeStyle } from '../types';

interface DrawingStore extends DrawingState {
  currentPath: Path | null;
  history: Path[][];
  redoStack: Path[][];
  shapeInProgress: boolean;
  setTool: (tool: DrawingTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setShapeStyle: (style: ShapeStyle) => void;
  addPoint: (point: Point) => void;
  startPath: (point?: Point) => void;
  updateShape: (endPoint: Point) => void;
  endPath: () => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  setRemotePath: (path: Path) => void;
}

export const useStore = create<DrawingStore>((set, get) => ({
  tool: 'pen',
  color: '#000000',
  size: 5,
  paths: [],
  currentPath: null,
  history: [],
  redoStack: [],
  shapeInProgress: false,
  shapeStyle: 'stroke',

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => {
    const validSize = Math.max(1, Math.min(50, size));
    set({ size: validSize });
  },
  
  startPath: (point?: Point) => {
    const { tool, color, size, shapeStyle } = get();
    const id = Date.now().toString();
    const startPoint = point || { x: 0, y: 0 };

    if (tool === 'rectangle' || tool === 'circle') {
      set({
        currentPath: {
          id,
          tool,
          points: [],
          color,
          size,
          shapeData: {
            startPoint,
            endPoint: startPoint,
            style: shapeStyle
          }
        },
        shapeInProgress: true
      });
    } else {
      set({
        currentPath: {
          id,
          tool,
          points: point ? [point] : [],
          color,
          size
        }
      });
    }
  },

  updateShape: (endPoint: Point) => {
    set((state) => {
      if (!state.currentPath?.shapeData) return state;

      return {
        currentPath: {
          ...state.currentPath,
          shapeData: {
            ...state.currentPath.shapeData,
            endPoint
          }
        }
      };
    });
  },

  setShapeStyle: (style: ShapeStyle) => set({ shapeStyle: style }),
  
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

  setRemotePath: (path: Path) => 
    set((state) => {
      const newHistory = [...state.history, state.paths];
      return {
        paths: [...state.paths, path],
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
