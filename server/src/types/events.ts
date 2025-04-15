export interface Point {
  x: number;
  y: number;
}

export interface ShapeData {
  startPoint: Point;
  endPoint: Point;
  style: 'stroke' | 'fill';
}

export interface DrawingData {
  points: Point[];
  color: string;
  size: number;
  tool: string;
  shapeData?: ShapeData;
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
}

export interface ClientToServerEvents {
  'draw': (data: DrawingData) => void;
  'client-ready': () => void;
  'start-drawing': () => void;
  'stop-drawing': () => void;
  'set-name': (name: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userColor?: string;
  roomId?: string;
}

export interface UserData {
  id: string;
  color: string;
  isDrawing?: boolean;
  lastActive?: number;
  name?: string;
}
