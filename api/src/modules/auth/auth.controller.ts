import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from '@/shared/decorators/public.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { EmailDto } from './dto/email.dto';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefresTokenDto } from './dto/refresh-token.dto';
import { SignOutDto } from './dto/sign-out.dto';
import { RegisterUseCase } from './use-cases/register.use-case';
import { VerifyUseCase } from './use-cases/verify.use-case';
import { SignInUseCase } from './use-cases/sign-in.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { SignOutUseCase } from './use-cases/sign-out.use.case';
import { GetMySessionsUseCase } from './use-cases/get-my-sessions.use-case';
import { resendOtpCodeUseCase } from './use-cases/resend-otp-code.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyUseCase: VerifyUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly signOutUseCase: SignOutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getMySessionsUseCase: GetMySessionsUseCase,
    private readonly resendOtpCodeUseCase: resendOtpCodeUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.registerUseCase.execute(registerDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verifyUser(@Body() verifyUserDto: VerifyUserDto) {
    return await this.verifyUseCase.execute(verifyUserDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefresTokenDto) {
    return await this.refreshTokenUseCase.execute(refreshTokenDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return await this.signInUseCase.execute(signInDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-out')
  async signOut(
    @CurrentUser() user: IJwtPayload,
    @Body() signOutDto: SignOutDto,
  ) {
    return await this.signOutUseCase.execute(user.sub, signOutDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('get-my-sessions')
  async getMySessions(@CurrentUser() user: IJwtPayload) {
    return await this.getMySessionsUseCase.execute(user.sub);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp-code')
  async resendOtpCode(@Body() EmailDto: EmailDto) {
    return await this.resendOtpCodeUseCase.execute(EmailDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() emailDto: EmailDto) {
    return await this.forgotPasswordUseCase.execute(emailDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3, blockDuration: 180000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.resetPasswordUseCase.execute(resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: IJwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const { email } = user;
    return await this.changePasswordUseCase.execute(email, changePasswordDto);
  }
}
