export type Point = {
  x: number;
  y: number;
};

export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle';
export type ShapeStyle = 'stroke' | 'fill';

export interface ShapeData {
  startPoint: Point;
  endPoint: Point;
  style: ShapeStyle;
}

export interface Path {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color: string;
  size: number;
  shapeData?: ShapeData;
}

export interface DrawingState {
  tool: DrawingTool;
  color: string;
  size: number;
  paths: Path[];
  shapeStyle: ShapeStyle;
}

export interface DrawingData {
  points: Point[];
  color: string;
  size: number;
  tool: string;
  shapeData?: ShapeData;
}

export interface UserData {
  id: string;
  color: string;
  isDrawing?: boolean;
  lastActive?: number;
  name?: string;
}

export interface UserPresence {
  users: UserData[];
  activeUser?: string;
}
