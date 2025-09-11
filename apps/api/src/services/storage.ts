import { GridFSBucket, ObjectId } from 'mongodb';
import { db } from './database';
import * as fs from 'fs';

class StorageService {
  private bucket: GridFSBucket | null = null;

  private async getBucket(): Promise<GridFSBucket> {
    if (!this.bucket) {
      const database = await db['ensureConnection']();
      this.bucket = new GridFSBucket(database, { bucketName: 'pdf_files' });
    }
    return this.bucket;
  }

  async uploadFile(filePath: string, fileName: string): Promise<string> {
    const bucket = await this.getBucket();
    
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(fileName, {
        metadata: { 
          uploadDate: new Date(),
          contentType: 'application/pdf'
        }
      });

      const fileStream = fs.createReadStream(filePath);
      
      fileStream.pipe(uploadStream)
        .on('error', (error) => {
          reject(error);
        })
        .on('finish', () => {
          resolve(uploadStream.id.toString());
        });
    });
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const bucket = await this.getBucket();
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
      
      downloadStream
        .on('data', (chunk) => {
          chunks.push(chunk);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve(Buffer.concat(chunks));
        });
    });
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const bucket = await this.getBucket();
      await bucket.delete(new ObjectId(fileId));
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getFileInfo(fileId: string): Promise<any> {
    const bucket = await this.getBucket();
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    return files[0] || null;
  }
}

export const storageService = new StorageService();