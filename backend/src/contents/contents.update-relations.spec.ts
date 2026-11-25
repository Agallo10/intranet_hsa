import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { ContentsService } from './contents.service.js';
import { Content } from './content.entity.js';
import { ContentType } from '../common/content-type.enum.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { CategoriesService } from '../categories/categories.service.js';
import { AuditService } from '../audit/audit.service.js';

const admin: AuthUser = {
  userId: 'admin-1',
  username: 'admin',
  role: Role.Admin,
};

function baseContent(): Content {
  return {
    id: 'content-1',
    title: 'Documento',
    description: null,
    code: null,
    version: null,
    elaborationDate: null,
    updateDate: null,
    type: ContentType.Document,
    filePath: 'file.pdf',
    embedUrl: null,
    originalName: 'file.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    isPublished: true,
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Anterior' } as never,
    areaId: 'area-1',
    area: { id: 'area-1', name: 'Anterior' } as never,
    cursoId: null,
    curso: null,
    position: 0,
    uploadedById: 'user-1',
    uploadedBy: undefined as never,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Content;
}

function createService() {
  const repository = {
    findOne: vi.fn(async () => baseContent()),
    findOneOrFail: vi.fn(async () => baseContent()),
    save: vi.fn(async (value: Content) => value),
    remove: vi.fn(),
  };
  const categories = {
    findById: vi.fn(async (id: string) => ({ id, isActive: true })),
  };
  const areas = {
    findOne: vi.fn(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      isActive: true,
    })),
  };
  const config = {
    get: (key: string) => (key === 'UPLOAD_DIR' ? '/tmp' : undefined),
  } as unknown as ConfigService;

  const service = new ContentsService(
    repository as never,
    config,
    categories as unknown as CategoriesService,
    {} as never,
    areas as never,
    {} as AuditService,
  );
  return { service, repository };
}

describe('ContentsService.update — categoría y área', () => {
  it('cambia la categoría y actualiza también la relación cargada', async () => {
    const { service, repository } = createService();

    await service.update('content-1', { categoryId: 'cat-2' }, admin);

    const saved = repository.save.mock.calls[0][0] as Content;
    expect(saved.categoryId).toBe('cat-2');
    expect((saved.category as { id: string }).id).toBe('cat-2');
  });

  it('quita la categoría cuando se envía vacía', async () => {
    const { service, repository } = createService();

    await service.update('content-1', { categoryId: '' }, admin);

    const saved = repository.save.mock.calls[0][0] as Content;
    expect(saved.categoryId).toBeNull();
    expect(saved.category).toBeNull();
  });

  it('cambia el área y actualiza también la relación cargada', async () => {
    const { service, repository } = createService();

    await service.update('content-1', { areaId: 'area-2' }, admin);

    const saved = repository.save.mock.calls[0][0] as Content;
    expect(saved.areaId).toBe('area-2');
    expect((saved.area as { id: string }).id).toBe('area-2');
  });

  it('quita el área cuando se envía vacía', async () => {
    const { service, repository } = createService();

    await service.update('content-1', { areaId: '' }, admin);

    const saved = repository.save.mock.calls[0][0] as Content;
    expect(saved.areaId).toBeNull();
    expect(saved.area).toBeNull();
  });
});
