export type Point = {
    x: number;
    y: number;
  };
  
  export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle';
  
  export type Path = {
    id: string;
    tool: DrawingTool;
    points: Point[];
    color: string;
    size: number;
  };
  
  export type DrawingState = {
    tool: DrawingTool;
    color: string;
    size: number;
    paths: Path[];
  };