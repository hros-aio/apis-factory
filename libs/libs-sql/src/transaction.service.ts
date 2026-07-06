import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RequestContextService } from '@new-hros/libs-core';

@Injectable()
export class TransactionService {
  public static readonly TRANSACTION_MANAGER_KEY = '_entityManager';

  constructor(private readonly defaultManager: EntityManager) {}

  getManager(): EntityManager {
    const currentContext = RequestContextService.current() as any;
    if (currentContext && currentContext[TransactionService.TRANSACTION_MANAGER_KEY]) {
      return currentContext[TransactionService.TRANSACTION_MANAGER_KEY];
    }
    return this.defaultManager;
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const currentContext = RequestContextService.current() as any;
    
    // Propagation: if already in a transaction, reuse it
    if (currentContext && currentContext[TransactionService.TRANSACTION_MANAGER_KEY]) {
      return work();
    }

    return this.defaultManager.transaction(async (transactionalEntityManager) => {
      if (currentContext) {
        currentContext[TransactionService.TRANSACTION_MANAGER_KEY] = transactionalEntityManager;
      }
      try {
        return await work();
      } finally {
        if (currentContext) {
          delete currentContext[TransactionService.TRANSACTION_MANAGER_KEY];
        }
      }
    });
  }
}
