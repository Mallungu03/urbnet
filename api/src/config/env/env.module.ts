import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './env.config';
import { validationSchema } from './validation.config';
import { EnvService } from './env.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: validationSchema,
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
