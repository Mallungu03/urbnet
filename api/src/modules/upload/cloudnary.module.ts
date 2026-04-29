import { Global, Module } from '@nestjs/common';
import { CloudinaryProvider } from './upload.provider';
import { UploadService } from './upload.service';

@Global()
@Module({
  providers: [CloudinaryProvider, UploadService],
  exports: [UploadService],
})
export class CloudinaryModule {}
