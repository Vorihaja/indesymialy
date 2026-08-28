import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaFollowRepository,
} from "../repositories/korana-follow.repository";

import {
  KoranaFollowService,
} from "../services/korana-follow.service";

import {
  FollowKoranaActorUseCase,
} from "../use-cases/follow-korana-actor.use-case";

import {
  UnfollowKoranaActorUseCase,
} from "../use-cases/unfollow-korana-actor.use-case";


let service:
  KoranaFollowService | null =
    null;


function makeService() {

  service ??=
    new KoranaFollowService(
      new KoranaFollowRepository(
        createSupabaseBrowserClient(),
      ),
    );


  return service;
}


export function makeFollowKoranaActorUseCase() {

  return new FollowKoranaActorUseCase(
    makeService(),
  );
}


export function makeUnfollowKoranaActorUseCase() {

  return new UnfollowKoranaActorUseCase(
    makeService(),
  );
}