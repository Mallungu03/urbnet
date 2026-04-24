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
    return this.getManyUseCase.execute(user.sub);
  }

  @Get(':id')
  findUnique(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    return this.findUniqueUseCase.execute(user.sub, +id);
  }

  @Patch('mark-read/:id')
  markRead(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    return this.markReadUseCase.execute(user.sub, +id);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: IJwtPayload) {
    const id = user.sub;
    return this.markAllReadUseCase.execute(id);
  }

  @Delete('delete/:id')
  async delete(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    return this.deleteUseCase.execute(user.sub, +id);
  }
}
