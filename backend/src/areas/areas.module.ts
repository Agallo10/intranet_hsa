import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from './area.entity.js';
import { AreasService } from './areas.service.js';
import { AreasController } from './areas.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Area])],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}
