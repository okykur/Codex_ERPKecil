import { ForbiddenException } from "@nestjs/common";
import { AuthenticatedUser } from "./jwt-auth.guard";

export function assertAdministrator(user: AuthenticatedUser) {
  if (!user.roles.includes("administrator")) {
    throw new ForbiddenException("Hanya role Administrator yang boleh mengubah data master.");
  }
}
