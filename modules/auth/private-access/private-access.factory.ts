import "server-only";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { AuthRepository } from "@/modules/auth/repositories";
import { AuthService } from "@/modules/auth/services";
import { PrivateAccessRepository } from "./private-access.repository";
import { PrivateAccessService } from "./private-access.service";
import { PrivateAccessUseCase } from "./private-access.use-case";

export async function createPrivateAccessUseCase(): Promise<PrivateAccessUseCase> {
  const supabase = await createSupabaseServerClient();
  return new PrivateAccessUseCase(
    new PrivateAccessService(
      new AuthService(new AuthRepository(supabase)),
      new PrivateAccessRepository(supabase),
    ),
  );
}
