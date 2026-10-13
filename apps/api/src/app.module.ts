import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOptions } from "./database/typeorm.config";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { HealthModule } from "./modules/health/health.module";
import { PurchaseRequestsModule } from "./modules/purchase-requests/purchase-requests.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsersModule } from "./modules/users/users.module";
import { VendorsModule } from "./modules/vendors/vendors.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions()
    }),
    HealthModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    RolesModule,
    VendorsModule,
    PurchaseRequestsModule
  ]
})
export class AppModule {}
