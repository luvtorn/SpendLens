import { Module } from "@nestjs/common";
import { ReceiptsController } from "@/receipts/receipts.controller";
import { ReceiptsService } from "@/receipts/receipts.service";

@Module({ controllers: [ReceiptsController], providers: [ReceiptsService] })
export class ReceiptsModule {}
