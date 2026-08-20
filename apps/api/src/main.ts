import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ApiExceptionFilter } from "@/common/api-exception.filter";
import { parseEnvironment } from "@/config/environment";

async function bootstrap(): Promise<void> {
  const environment = parseEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: environment.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    methods: ["GET", "POST", "OPTIONS"],
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(environment.PORT, "0.0.0.0");
}

void bootstrap();
