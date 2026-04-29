import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { CreateReportUseCase } from './use-cases/create-report.usecase';
import { DeleteReportUseCase } from './use-cases/delete-report.use-case';
import { FindUniqueReportUseCase } from './use-cases/find-unique-report.use-case';
import { FindManyQuery } from '@/shared/queries/find-many.query';
import { FindManyReportsUseCase } from './use-cases/find-many-reports.use-case';
import { ConfirmReportUseCase } from './use-cases/confirm-report.use-case';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateReportUseCase } from './use-cases/update-report.use-case';
import { CreateProximityAlertUseCase } from './use-cases/create-proximity-alert.use-case';
import { FindManyAlertZonesUseCase } from './use-cases/find-many-alert-zones.use-case';
import { FindUniqueAlertZoneUseCase } from './use-cases/find-unique-alert-zones.use-case';
import { CreateProximityAlertDto } from './dto/create-proximity-alert.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly confirmReportUseCase: ConfirmReportUseCase,
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly updateReportUseCase: UpdateReportUseCase,
    private readonly deleteReportUseCase: DeleteReportUseCase,
    private readonly findUniqueReportUseCase: FindUniqueReportUseCase,
    private readonly findManyReportsUseCase: FindManyReportsUseCase,
    private readonly createProximityAlertUseCase: CreateProximityAlertUseCase,
    private readonly findManyUseCase: FindManyAlertZonesUseCase,
    private readonly findUniqueUseCase: FindUniqueAlertZoneUseCase,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @CurrentUser() user: IJwtPayload,
    @Body() dto: CreateReportDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.createReportUseCase.execute(user.sub, dto, file);
  }

  @Get('find-many')
  findMany(@Query() query: FindManyQuery) {
    return this.findManyReportsUseCase.execute(query);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @CurrentUser() user: IJwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file?: Express.Multer.File,
  ) {
    return this.updateReportUseCase.execute(user.sub, id, dto, file);
  }

  @Get(':id')
  async findUnique(@Param('id', ParseUUIDPipe) id: string) {
    return await this.findUniqueReportUseCase.execute(id);
  }

  @Patch('confirm/:id')
  async confirm(
    @CurrentUser() user: IJwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.confirmReportUseCase.execute(user.sub, id);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: IJwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.deleteReportUseCase.execute(user.sub, id);
  }

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
  findManyAlerts(
    @CurrentUser() user: IJwtPayload,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.findManyUseCase.execute(user.sub, { page, limit });
  }

  @HttpCode(HttpStatus.FOUND)
  @Get(':id')
  findUniqueAlerts(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    return this.findUniqueUseCase.execute(user.sub, id);
  }
}
