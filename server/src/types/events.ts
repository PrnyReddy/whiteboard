export interface Point {
  x: number;
  y: number;
}

export interface DrawingData {
  points: Point[];
  color: string;
  size: number;
  tool: string;
}

export interface ServerToClientEvents {
  'drawing': (data: DrawingData) => void;
  'client-count': (count: number) => void;
  'client-ready': (data: UserData) => void;
}

export interface ClientToServerEvents {
  'draw': (data: DrawingData) => void;
  'client-ready': () => void;
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
}
