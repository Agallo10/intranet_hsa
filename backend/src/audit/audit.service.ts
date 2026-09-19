import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity.js';

export interface AuditEvent {
  action: string;
  userId?: string | null;
  username?: string | null;
  details?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  record(event: AuditEvent): Promise<AuditLog> {
    const log = this.auditRepository.create({
      action: event.action,
      userId: event.userId ?? null,
      username: event.username ?? null,
      details: event.details ?? null,
      ip: event.ip ?? null,
      userAgent: event.userAgent ?? null,
    });
    return this.auditRepository.save(log);
  }

  async findAll(query: {
    action?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));

    const qb = this.auditRepository.createQueryBuilder('log');

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }
    if (query.q) {
      qb.andWhere('(log.username ILIKE :q OR log.details ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
