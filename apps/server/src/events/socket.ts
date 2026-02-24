import { Server, Socket } from 'socket.io';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('workspace:subscribe', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Client ${socket.id} subscribed to workspace ${workspaceId}`);
    });

    socket.on('workspace:unsubscribe', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`Client ${socket.id} unsubscribed from workspace ${workspaceId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

/**
 * Emit event to specific workspace room
 */
export function emitToWorkspace(io: Server, workspaceId: string, event: string, data: any) {
  io.to(`workspace:${workspaceId}`).emit(event, data);
  // Also emit globally for clients that haven't subscribed
  io.emit(event, data);
}
