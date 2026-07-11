import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { setupVersioning } from '../src/versioning/versioning.setup';

describe('API Versioning Setup Utility', () => {
  let app: INestApplication;
  let enableVersioningSpy: jest.SpyInstance;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({}).compile();
    app = moduleRef.createNestApplication();
    enableVersioningSpy = jest.spyOn(app, 'enableVersioning');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call enableVersioning with VersioningType.MEDIA_TYPE and key "v"', () => {
    setupVersioning(app);

    expect(enableVersioningSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: VersioningType.MEDIA_TYPE,
        key: 'v',
      }),
    );
  });

  it('should respect custom default version from options', () => {
    setupVersioning(app, { defaultVersion: '2' });

    expect(enableVersioningSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: VersioningType.MEDIA_TYPE,
        key: 'v',
        defaultVersion: '2',
      }),
    );
  });
});
