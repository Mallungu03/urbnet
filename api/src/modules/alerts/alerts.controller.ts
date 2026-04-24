import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  HttpCode,
  HttpStatus,
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

  @HttpCode(HttpStatus.CREATED)
  @Post()
  createProximityAlert(
    @CurrentUser() user: IJwtPayload,
    @Body() param: CreateProximityAlertDto,
  ) {
    return this.createProximityAlertUseCase.execute(user.sub, param);
  }

  @HttpCode(HttpStatus.FOUND)
  @Get('find-many')
  findMany(
    @CurrentUser() user: IJwtPayload,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.findManyUseCase.execute(user.sub, { page, limit });
  }

  @HttpCode(HttpStatus.FOUND)
  @Get(':id')
  findUnique(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    return this.findUniqueUseCase.execute(user.sub, id);
  }
}
