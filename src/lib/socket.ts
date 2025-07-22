import { io } from 'socket.io-client';

export const socket = io('http://localhost:9000', {
  query: { userId: localStorage.getItem('userId') },
  autoConnect: false,
}); 