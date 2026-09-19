import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/role.enum.js';

@Controller('audit-logs')
@Roles(Role.Admin)
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query() query: { action?: string; q?: string; page?: string; limit?: string },
  ) {
    return this.auditService.findAll({
      action: query.action,
      q: query.q,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }
}
