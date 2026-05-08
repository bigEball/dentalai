export function isRecordNotFoundError(error: unknown): boolean {
  const maybePrismaError = error as { code?: string; message?: string };
  return maybePrismaError.code === 'P2025' || maybePrismaError.message?.includes('Record to update not found') === true;
}
