import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigins = config
    .get<string>("CORS_ORIGINS", "http://localhost:3002")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: corsOrigins,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  const port = config.get<number>("API_PORT", 8001);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
