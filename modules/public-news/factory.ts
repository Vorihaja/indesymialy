import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { PublicNewsSupabaseRepository } from './repositories/public-news.repository';
import { PublicNewsService } from './services/public-news.service';
import { ListPublicNewsUseCase } from './use-cases/list-public-news.use-case';
let instance: ListPublicNewsUseCase | undefined;
export function createPublicNewsUseCase() { instance ??= new ListPublicNewsUseCase(new PublicNewsService(new PublicNewsSupabaseRepository(createSupabaseBrowserClient()))); return instance; }
