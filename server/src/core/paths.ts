import path from 'path';

export const projectRoot = path.resolve(__dirname, '..', '..', '..');
export const dataDir = path.join(projectRoot, 'data');
export const uploadsDir = path.join(dataDir, 'uploads');
export const clientDistDir = path.join(projectRoot, 'client', 'dist');

export function dataFilePath(fileName: string): string {
  return path.join(dataDir, fileName);
}
