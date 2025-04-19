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
  name: string;
  isDrawing?: boolean;
  lastActive?: number;
  cursorPosition?: Point;
}

export interface ServerToClientEvents {
  'drawing': (data: DrawingData) => void;
  'client-count': (count: number) => void;
  'client-ready': (data: UserData) => void;
  'user-joined': (data: UserData) => void;
  'user-left': (userId: string) => void;
  'user-started-drawing': (userId: string) => void;
  'user-stopped-drawing': (userId: string) => void;
  'users-updated': (users: UserData[]) => void;
  'cursor-updated': (data: { userId: string; position: Point }) => void;
}

export interface ClientToServerEvents {
  'draw': (data: DrawingData) => void;
  'client-ready': () => void;
  'start-drawing': () => void;
  'stop-drawing': () => void;
  'set-name': (name: string) => void;
  'activity': () => void;
  'cursor-move': (position: Point) => void;
  'color-change': (color: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
}
