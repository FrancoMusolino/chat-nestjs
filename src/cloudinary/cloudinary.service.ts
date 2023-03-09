import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  private getAssetPublicId(assetUrl: string) {
    return extractPublicId(assetUrl);
  }

  async deleteAsset(assetUrl: string) {
    const publicId = this.getAssetPublicId(assetUrl);

    try {
      const res = await cloudinary.uploader.destroy(publicId);

      if (res.result && res.result === 'not found') {
        throw new Error(`Asset con publicId ${publicId} no encontrado`);
      }

      return { success: true };
    } catch (error: any) {
      console.log(error);
      throw new ConflictException(error.message || 'Error eliminando el asset');
    }
  }
}
