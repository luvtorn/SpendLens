import { Controller, Get } from "@nestjs/common";
import { TransactionsService } from "@/transactions/transactions.service";
import type { TransactionResponse } from "@/transactions/transactions.types";
import { CurrentUserDecorator } from "@/auth/current-user.decorator";
import type { CurrentUser } from "@/auth/auth.types";

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(@CurrentUserDecorator() user: CurrentUser): Promise<TransactionResponse[]> {
    return this.transactionsService.listForUser(user.id);
  }
}
