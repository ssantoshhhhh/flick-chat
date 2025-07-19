import { useWhiteboard } from '../hooks/useWhiteboard';
import { useEffect } from 'react';

export default function WhiteboardCanvas({ whiteboardId }) {
  const { joinWhiteboard, leaveWhiteboard, emitDraw, saveSnapshot, ...rest } = useWhiteboard();
  useEffect(() => {
    joinWhiteboard(whiteboardId);
    return () => leaveWhiteboard(whiteboardId);
  }, [whiteboardId]);
  // Integrate with Excalidraw/Fabric.js and emitDraw on drawing events
  return <div>{/* Canvas here */}</div>;
} 