import { Controller, Get } from "@nestjs/common";
import { ReceiptsService } from "@/receipts/receipts.service";
import type { ReceiptResponse } from "@/receipts/receipts.types";
import { CurrentUserDecorator } from "@/auth/current-user.decorator";
import type { CurrentUser } from "@/auth/auth.types";

@Controller("receipts")
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  list(@CurrentUserDecorator() user: CurrentUser): Promise<ReceiptResponse[]> {
    return this.receiptsService.listForUser(user.id);
  }
}
