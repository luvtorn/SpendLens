import { Controller, Get } from "@nestjs/common";
import { StatementsService } from "@/statements/statements.service";
import type { StatementResponse } from "@/statements/statements.types";
import { CurrentUserDecorator } from "@/auth/current-user.decorator";
import type { CurrentUser } from "@/auth/auth.types";

@Controller("statements")
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get()
  list(@CurrentUserDecorator() user: CurrentUser): Promise<StatementResponse[]> {
    return this.statementsService.listForUser(user.id);
  }
}
