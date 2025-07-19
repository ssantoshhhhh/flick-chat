import { useCallback } from 'react';
import { socket } from '../lib/socket';

export function useCall() {
  // Join/leave video call room
  const joinCall = useCallback((roomId: string, userId: string) => {
    socket.emit('video:join', { roomId, userId });
  }, []);
  const leaveCall = useCallback((roomId: string, userId: string) => {
    socket.emit('video:leave', { roomId, userId });
  }, []);

  // Screen sharing
  const startScreenShare = useCallback((roomId: string, userId: string) => {
    socket.emit('video:screen-share-start', { roomId, userId });
  }, []);
  const stopScreenShare = useCallback((roomId: string, userId: string) => {
    socket.emit('video:screen-share-stop', { roomId, userId });
  }, []);

  // WebRTC signaling
  const sendSignal = useCallback((roomId: string, signal: any, to?: string) => {
    socket.emit('video:signal', { roomId, signal, to });
  }, []);

  // Listen for events (to be used in useEffect in component)
  // socket.on('video:user-joined', ...)
  // socket.on('video:user-left', ...)
  // socket.on('video:screen-share-start', ...)
  // socket.on('video:screen-share-stop', ...)
  // socket.on('video:signal', ...)

  return {
    joinCall, leaveCall,
    startScreenShare, stopScreenShare,
    sendSignal,
    socket // for event listeners
  };
} 