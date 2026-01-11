import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Message } from '../../../shared/src/models/message';

interface PresencePayload {
  userId: string;
  displayName: string;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  private readonly onlineUsers = new Map<string, PresencePayload>();

  @SubscribeMessage('presence:join')
  handlePresenceJoin(
    @MessageBody() payload: PresencePayload,
    @ConnectedSocket() socket: Socket,
  ) {
    this.onlineUsers.set(socket.id, payload);
    this.server.emit('presence:update', Array.from(this.onlineUsers.values()));
  }

  @SubscribeMessage('typing:update')
  handleTyping(
    @MessageBody() payload: TypingPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.broadcast.emit('typing:update', payload);
  }

  handleDisconnect(client: Socket) {
    if (this.onlineUsers.delete(client.id)) {
      this.server.emit('presence:update', Array.from(this.onlineUsers.values()));
    }
  }

  emitMessageCreated(message: Message) {
    this.server.emit('message:created', message);
  }

  emitMessageUpdated(message: Message) {
    this.server.emit('message:updated', message);
  }

  emitMessageDeleted(message: Message) {
    this.server.emit('message:deleted', message);
  }
}
