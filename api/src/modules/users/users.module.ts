import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { MyProfileUseCase } from './use-cases/my-profile.use-case';
import { FindManyUsersUseCase } from './use-cases/find-many-users.use-case';
import { FindUniqueUserUseCase } from './use-cases/find-unique-user.use-case';
import { UpdateUserUseCase } from './use-cases/update.use-case';
import { FollowUseCase } from './use-cases/follow.use-case';
import { GetFollowersUseCase } from './use-cases/get-followers.use-case';
import { GetFollowingsUseCase } from './use-cases/get-followings.use-case';
import { deleteAccountUseCase } from './use-cases/delete-account.use-case';
import { UnfollowUseCase } from './use-cases/unfollow.use-case';
import { UserAvatarStorageService } from './services/user-avatar-storage.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserAvatarStorageService,
    MyProfileUseCase,
    FindManyUsersUseCase,
    FindUniqueUserUseCase,
    UpdateUserUseCase,
    FollowUseCase,
    GetFollowersUseCase,
    GetFollowingsUseCase,
    deleteAccountUseCase,
    UnfollowUseCase,
  ],
})
export class UsersModule {}
