import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  ParseFilePipeBuilder,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { FindManyUsersUseCase } from './use-cases/find-many-users.use-case';
import { FindUniqueUserUseCase } from './use-cases/find-unique-user.use-case';
import { MyProfileUseCase } from './use-cases/my-profile.use-case';
import { UpdateUserUseCase } from './use-cases/update.use-case';
import { deleteAccountUseCase } from './use-cases/delete-account.use-case';
import { GetFollowersUseCase } from './use-cases/get-followers.use-case';
import { GetFollowingsUseCase } from './use-cases/get-followings.use-case';
import { UnfollowUseCase } from './use-cases/unfollow.use-case';
import { FollowUseCase } from './use-cases/follow.use-case';
import { FindManyQueryDto } from '@/shared/queries/find-many.query';

@Controller('users')
export class UsersController {
  constructor(
    private readonly followUseCase: FollowUseCase,
    private readonly findManyUseCase: FindManyUsersUseCase,
    private readonly findUniqueUseCase: FindUniqueUserUseCase,
    private readonly myProfileUseCase: MyProfileUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteAccountUseCase: deleteAccountUseCase,
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly getFollowingsUseCase: GetFollowingsUseCase,
    private readonly unfollowUseCase: UnfollowUseCase,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get('my-profile')
  myProfile(@CurrentUser() user: IJwtPayload) {
    return this.myProfileUseCase.execute(user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Get('find-many')
  findMany(@Query() query: FindManyQueryDto) {
    return this.findManyUseCase.execute(query);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findUnique(@Param('id') id: string) {
    return this.findUniqueUseCase.execute(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  update(
    @CurrentUser() user: IJwtPayload,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
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
    return this.updateUserUseCase.execute(user.sub, id, updateUserDto, file);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  deleteAccount(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    return this.deleteAccountUseCase.execute(user.sub, id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':id/follow')
  follow(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const followingId = id;
    return this.followUseCase.execute(user.sub, followingId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/unfollow')
  unfollow(@CurrentUser() user: IJwtPayload, @Param('id') id: string) {
    const followingId = id;
    return this.unfollowUseCase.execute(user.sub, followingId);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.getFollowersUseCase.execute(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id/followings')
  getFollowing(@Param('id') id: string) {
    return this.getFollowingsUseCase.execute(id);
  }
}
