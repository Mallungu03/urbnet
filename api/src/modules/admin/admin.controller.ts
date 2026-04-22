import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role, Roles } from '@/shared/decorators/roles.decorators';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { AlterUserRoleUseCase } from './use-cases/alter-user-role.use-case';
import { BanedUserUseCase } from './use-cases/baned-user.use-case';
import { CreateCategoryUseCase } from './use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './use-cases/update-category.use-case';
import { RemoveCategoryUseCase } from './use-cases/remove-category.use-case';

@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly alterUserRoleUseCase: AlterUserRoleUseCase,
    private readonly banedUserUseCase: BanedUserUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly removeCategoryUseCase: RemoveCategoryUseCase,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('create-category')
  createCategory(
    @CurrentUser() user: IJwtPayload,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const id = user.sub;
    return this.createCategoryUseCase.execute(id, createCategoryDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('update-category')
  updateCategory(
    @CurrentUser() user: IJwtPayload,
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateCategoryDto,
  ) {
    const userId = user.sub;
    return this.updateCategoryUseCase.execute(userId, +id, updateAdminDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('remove-category')
  removeCategory(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const userId = user.sub;
    return this.removeCategoryUseCase.execute(userId, +id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('baned-user')
  banedUser(
    @CurrentUser() user: IJwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = user.sub;
    return this.banedUserUseCase.execute(userId, id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('alter-user-role')
  alterUserRole(
    @CurrentUser() user: IJwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = user.sub;
    return this.alterUserRoleUseCase.execute(userId, id);
  }
}
