import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { EnvModule } from '@/shared/config/env.module';
import { EnvService } from '@/shared/config/env.service';
import { JwtStrategy } from './strategies/jwt-strategy';
import { RegisterUseCase } from './use-cases/register.use-case';
import { VerifyUseCase } from './use-cases/verify.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { SignInUseCase } from './use-cases/sign-in.use-case';
import { SignOutUseCase } from './use-cases/sign-out.use.case';
import { GetMySessionsUseCase } from './use-cases/get-my-sessions.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { resendOtpCodeUseCase } from './use-cases/resend-otp-code.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';

@Module({
  imports: [
    EnvModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        global: true,
        secret: env.jwtAccessSecret,
        signOptions: { expiresIn: env.jwtAccessExpiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RegisterUseCase,
    VerifyUseCase,
    SignInUseCase,
    RefreshTokenUseCase,
    SignOutUseCase,
    GetMySessionsUseCase,
    resendOtpCodeUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
  ],
  exports: [JwtStrategy],
})
export class AuthModule {}
