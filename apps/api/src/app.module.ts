import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AnalyticsModule } from "@/analytics/analytics.module";
import { AuthModule } from "@/auth/auth.module";
import { ConfigModule } from "@/config/config.module";
import { HealthModule } from "@/health/health.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ReceiptsModule } from "@/receipts/receipts.module";
import { StatementsModule } from "@/statements/statements.module";
import { TransactionsModule } from "@/transactions/transactions.module";

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    HealthModule,
    TransactionsModule,
    ReceiptsModule,
    StatementsModule,
    AnalyticsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
