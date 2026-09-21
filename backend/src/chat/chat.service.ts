import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity.js';
import { User } from '../users/user.entity.js';
import { resolveUploadDir, resolveUploadPath } from '../common/storage.js';

export interface AttachmentMeta {
  path: string;
  name: string;
  mime: string;
  size: number;
}

export const toMessageDto = (m: Message) => ({
  id: m.id,
  senderId: m.senderId,
  receiverId: m.receiverId,
  content: m.content,
  attachmentName: m.attachmentName,
  attachmentMime: m.attachmentMime,
  attachmentSize: m.attachmentSize,
  isRead: m.isRead,
  createdAt: m.createdAt,
});

@Injectable()
export class ChatService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    config: ConfigService,
  ) {
    this.uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
  }

  async send(
    senderId: string,
    receiverId: string,
    content?: string,
    attachment?: AttachmentMeta,
  ): Promise<Message> {
    if (senderId === receiverId) {
      throw new BadRequestException('No puede enviarse mensajes a sí mismo');
    }
    const receiver = await this.usersRepository.findOne({
      where: { id: receiverId, isActive: true },
    });
    if (!receiver) {
      throw new BadRequestException('El destinatario no es válido');
    }

    const message = this.messagesRepository.create({
      senderId,
      receiverId,
      content: content?.trim() ? content : null,
      attachmentPath: attachment?.path ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentMime: attachment?.mime ?? null,
      attachmentSize: attachment?.size ?? null,
      isRead: false,
    });

    return this.messagesRepository.save(message);
  }

  async history(
    userId: string,
    otherId: string,
    page = 1,
    limit = 50,
  ) {
    const take = Math.min(200, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [items, total] = await this.messagesRepository.findAndCount({
      where: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return {
      items: items.map(toMessageDto).reverse(),
      total,
      page: Math.max(1, page),
      limit: take,
    };
  }

  async markRead(userId: string, otherId: string): Promise<number> {
    const result = await this.messagesRepository.update(
      { receiverId: userId, senderId: otherId, isRead: false },
      { isRead: true },
    );
    return result.affected ?? 0;
  }

  async unreadTotal(userId: string): Promise<number> {
    return this.messagesRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async conversations(userId: string) {
    const partners = await this.messagesRepository
      .createQueryBuilder('m')
      .select('m.senderId', 'senderId')
      .addSelect('m.receiverId', 'receiverId')
      .addSelect('MAX(m.createdAt)', 'lastAt')
      .where('m.senderId = :userId OR m.receiverId = :userId', { userId })
      .groupBy('m.senderId')
      .addGroupBy('m.receiverId')
      .orderBy('lastAt', 'DESC')
      .getRawMany();

    const seen = new Set<string>();
    const result = [];
    for (const row of partners) {
      const otherId = row.senderId === userId ? row.receiverId : row.senderId;
      if (seen.has(otherId)) continue;
      seen.add(otherId);

      const user = await this.usersRepository.findOne({
        where: { id: otherId },
      });
      if (!user) continue;

      const last = await this.messagesRepository.findOne({
        where: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
        order: { createdAt: 'DESC' },
      });
      const unread = await this.messagesRepository.count({
        where: { receiverId: userId, senderId: otherId, isRead: false },
      });

      result.push({
        user: { id: user.id, fullName: user.fullName, role: user.role },
        lastMessage: last ? toMessageDto(last) : null,
        unreadCount: unread,
      });
    }

    return result;
  }

  async listUsers(userId: string, q?: string) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.isActive = :active', { active: true })
      .andWhere('user.id != :me', { me: userId });

    if (q) {
      qb.andWhere('(user.fullName ILIKE :q OR user.username ILIKE :q)', {
        q: `%${q}%`,
      });
    }

    const users = await qb.orderBy('user.fullName', 'ASC').take(100).getMany();
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      role: u.role,
    }));
  }

  async findMessage(id: string): Promise<Message | null> {
    return this.messagesRepository.findOne({ where: { id } });
  }

  getAttachmentPath(message: Message): string | null {
    return message.attachmentPath;
  }

  resolveAttachmentFullPath(message: Message): string | null {
    if (!message.attachmentPath) return null;
    return resolveUploadPath(this.uploadDir, message.attachmentPath);
  }
}
