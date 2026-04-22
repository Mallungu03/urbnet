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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { CreateReportUseCase } from './use-cases/create-report.usecase';
import { DeleteReportUseCase } from './use-cases/delete-report.use-case';
import { FindUniqueReportUseCase } from './use-cases/find-unique-report.use-case';
import { FindManyQueryDto } from '@/shared/queries/find-many.query';
import { FindManyReportsUseCase } from './use-cases/find-many-reports.use-case';
import { ConfirmReportUseCase } from './use-cases/confirm-report.use-case';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly confirmReportUseCase: ConfirmReportUseCase,
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly deleteReportUseCase: DeleteReportUseCase,
    private readonly findUniqueReportUseCase: FindUniqueReportUseCase,
    private readonly findManyReportsUseCase: FindManyReportsUseCase,
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
  findMany(@Query() query: FindManyQueryDto) {
    return this.findManyReportsUseCase.execute(query);
  }

  @Get('find-unique')
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
}
