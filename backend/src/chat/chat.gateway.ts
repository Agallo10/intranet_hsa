import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = (client.handshake.auth?.token as string) ?? undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    let userId: string | null = null;
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        type: string;
      }>(token, { secret: this.config.get<string>('JWT_ACCESS_SECRET') });
      if (payload.type === 'access') {
        userId = payload.sub;
      }
    } catch {
      userId = null;
    }

    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.join(`user:${userId}`);

    const sockets = this.onlineUsers.get(userId) ?? new Set<string>();
    const wasOnline = sockets.size > 0;
    sockets.add(client.id);
    this.onlineUsers.set(userId, sockets);

    if (!wasOnline) {
      this.server.emit('presence', { userId, online: true });
    }

    const onlineIds = Array.from(this.onlineUsers.keys());
    client.emit('online:init', { userIds: onlineIds });
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return;

    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.server.emit('presence', { userId, online: false });
      }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { receiverId: string },
  ): void {
    const senderId = client.data?.userId as string | undefined;
    if (!senderId || !body?.receiverId) return;
    this.server.to(`user:${body.receiverId}`).emit('typing', { senderId });
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  isOnline(userId: string): boolean {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }
}
