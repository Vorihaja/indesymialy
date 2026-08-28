import { AdminUsersRepository } from "../repositories";
import { AdminUsersService } from "../services";
import { GetAdminUsersUseCase } from "../use-cases";
export function createAdminUsersUseCase(): GetAdminUsersUseCase { return new GetAdminUsersUseCase(new AdminUsersService(new AdminUsersRepository())); }
