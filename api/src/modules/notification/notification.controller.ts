import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { FindUniqueUseCase } from './use-cases/find-unique.use-case';
import { GetManyUseCase } from './use-cases/get-many.use-case';
import { MarkAllReadUseCase } from './use-cases/mark-all-read';
import { MarkReadUseCase } from './use-cases/mark-read.use-case';
import { DeleteUseCase } from './use-cases/delete.use-case';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly findUniqueUseCase: FindUniqueUseCase,
    private readonly getManyUseCase: GetManyUseCase,
    private readonly markAllReadUseCase: MarkAllReadUseCase,
    private readonly markReadUseCase: MarkReadUseCase,
    private readonly deleteUseCase: DeleteUseCase,
  ) {}

  @Get('find-many')
  findMany(@CurrentUser() user: IJwtPayload) {
    const publicId = user.sub;
    return this.getManyUseCase.execute(publicId);
  }

  @Get(':id')
  findUnique(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const publicId = user.sub;
    return this.findUniqueUseCase.execute(publicId, +id);
  }

  @Patch('mark-read/:id')
  markRead(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const publicId = user.sub;
    return this.markReadUseCase.execute(publicId, +id);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: IJwtPayload) {
    const id = user.sub;
    return this.markAllReadUseCase.execute(id);
  }

  @Delete('delete')
  async delete(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const publicId = user.sub;
    return this.deleteUseCase.execute(publicId, +id);
  }
}
