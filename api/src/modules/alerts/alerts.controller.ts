import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { FindManyAlertZonesUseCase } from './use-cases/find-many-alert-zones.use-case';
import { FindUniqueAlertZoneUseCase } from './use-cases/find-unique-alert-zones.use-case';
import { CreateProximityAlertDto } from './dto/create-proximity-alert.dto';
import { CreateProximityAlertUseCase } from './use-cases/create-proximity-alert.use-case';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly createProximityAlertUseCase: CreateProximityAlertUseCase,
    private readonly findManyUseCase: FindManyAlertZonesUseCase,
    private readonly findUniqueUseCase: FindUniqueAlertZoneUseCase,
  ) {}

  @Post()
  createProximityAlert(
    @CurrentUser() user: IJwtPayload,
    @Body() param: CreateProximityAlertDto,
  ) {
    const publicId = user.sub;
    return this.createProximityAlertUseCase.execute(publicId, param);
  }

  @Get('find-many')
  findMany(
    @CurrentUser() user: IJwtPayload,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    const publicId = user.sub;
    return this.findManyUseCase.execute(publicId, { page, limit });
  }

  @Get(':id')
  findUnique(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const publicId = user.sub;
    return this.findUniqueUseCase.execute(publicId, id);
  }
}
