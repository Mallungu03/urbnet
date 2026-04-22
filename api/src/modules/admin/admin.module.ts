import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AlterUserRoleUseCase } from './use-cases/alter-user-role.use-case';
import { BanedUserUseCase } from './use-cases/baned-user.use-case';
import { CreateCategoryUseCase } from './use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './use-cases/update-category.use-case';
import { RemoveCategoryUseCase } from './use-cases/remove-category.use-case';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AlterUserRoleUseCase,
    BanedUserUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    RemoveCategoryUseCase,
  ],
})
export class AdminModule {}
