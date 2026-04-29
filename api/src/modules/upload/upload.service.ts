import { Injectable, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, DeleteApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Upload falhou: resultado indefinido'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  async uploadBuffer(buffer: Buffer, folder: string, publicId?: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder, public_id: publicId },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Upload falhou: resultado indefinido'));
          resolve(result);
        },
      );

      streamifier.createReadStream(buffer).pipe(upload);
    });
  }

  async deleteFile(publicId: string): Promise<DeleteApiResponse> {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'not found') {
      throw new NotFoundException(`Arquivo não encontrado: ${publicId}`);
    }

    return result;
  }

  getPublicUrl(publicId: string): string {
    const cloudName = cloudinary.config().cloud_name;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  }
}
