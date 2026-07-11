import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { setupSwagger } from '../src/swagger/swagger.setup';
import * as swaggerPkg from '@nestjs/swagger';

// Mock Swagger module calls to prevent actual filesystem/doc mounting in unit tests
jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');
  return {
    ...actual,
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
  };
});

describe('Swagger Setup Utility', () => {
  let app: INestApplication;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    const moduleRef = await Test.createTestingModule({}).compile();
    app = moduleRef.createNestApplication();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should skip setup if SWAGGER_ENABLED is not true and options.enabled is not true', () => {
    delete process.env.SWAGGER_ENABLED;

    setupSwagger(app);

    expect(swaggerPkg.SwaggerModule.createDocument).not.toHaveBeenCalled();
    expect(swaggerPkg.SwaggerModule.setup).not.toHaveBeenCalled();
  });

  it('should setup Swagger UI if SWAGGER_ENABLED is true', () => {
    process.env.SWAGGER_ENABLED = 'true';

    setupSwagger(app, {
      title: 'Test Service',
      description: 'Test Description',
      version: '1.2.3',
    });

    expect(swaggerPkg.SwaggerModule.createDocument).toHaveBeenCalled();
    expect(swaggerPkg.SwaggerModule.setup).toHaveBeenCalledWith(
      'docs', // Default path
      app,
      expect.any(Object),
    );
  });

  it('should respect custom document path from options or SWAGGER_PATH env', () => {
    process.env.SWAGGER_ENABLED = 'true';

    // 1. Check custom path in options
    setupSwagger(app, { path: 'api-docs' });
    expect(swaggerPkg.SwaggerModule.setup).toHaveBeenLastCalledWith(
      'api-docs',
      app,
      expect.any(Object),
    );

    // 2. Check path in environment
    process.env.SWAGGER_PATH = 'env-docs';
    setupSwagger(app);
    expect(swaggerPkg.SwaggerModule.setup).toHaveBeenLastCalledWith(
      'env-docs',
      app,
      expect.any(Object),
    );
  });

  it('should setup Bearer Authentication if bearerAuth option is true', () => {
    process.env.SWAGGER_ENABLED = 'true';

    const spyBuilder = jest.spyOn(swaggerPkg.DocumentBuilder.prototype, 'addBearerAuth');

    setupSwagger(app, { bearerAuth: true });

    expect(spyBuilder).toHaveBeenCalled();
  });

  it('should force setup if options.enabled is true even if SWAGGER_ENABLED env is missing', () => {
    delete process.env.SWAGGER_ENABLED;

    setupSwagger(app, { enabled: true });

    expect(swaggerPkg.SwaggerModule.createDocument).toHaveBeenCalled();
  });
});
