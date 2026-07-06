import { Injectable } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Injectable()
export class UnitOfWork {
  constructor(private readonly transactionService: TransactionService) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
    return this.transactionService.runInTransaction(work);
  }
}
