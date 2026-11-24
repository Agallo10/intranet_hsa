import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { UpdateDocumentTableConfigDto } from './dto/document-table-config.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/role.enum.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('document-table')
  async getDocumentTable() {
    const columns = await this.settingsService.getDocumentTableColumns();
    return { columns };
  }

  @Put('document-table')
  @Roles(Role.Admin)
  async updateDocumentTable(@Body() dto: UpdateDocumentTableConfigDto) {
    const columns = await this.settingsService.updateDocumentTableColumns(
      dto.columns,
    );
    return { columns };
  }
}
