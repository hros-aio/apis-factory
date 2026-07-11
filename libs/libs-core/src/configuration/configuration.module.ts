import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIGURATION_OPTIONS } from './configuration.constants';
import { ConfigurationModuleOptions, ConfigurationService } from './configuration.service';

@Global()
@Module({})
export class ConfigurationModule {
  static register(options: ConfigurationModuleOptions = {}): DynamicModule {
    return {
      module: ConfigurationModule,
      providers: [
        {
          provide: CONFIGURATION_OPTIONS,
          useValue: options,
        },
        ConfigurationService,
      ],
      exports: [ConfigurationService],
    };
  }
}
