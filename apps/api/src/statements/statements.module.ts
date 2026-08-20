import { Module } from "@nestjs/common";
import { StatementsController } from "@/statements/statements.controller";
import { StatementsService } from "@/statements/statements.service";

@Module({ controllers: [StatementsController], providers: [StatementsService] })
export class StatementsModule {}
