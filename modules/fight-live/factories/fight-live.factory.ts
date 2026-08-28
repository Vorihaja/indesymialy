import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  createRealtimeObservabilityService,
} from "@/modules/realtime-observability/factories/realtime-observability.factory";

import {
  FightEventRepository,
} from "../repositories/fight-event.repository";

import {
  FightJudgeRepository,
} from "../repositories/fight-judge.repository";

import {
  FightLiveRealtimeRepository,
} from "../repositories/fight-live-realtime.repository";

import {
  FightLiveSupabaseRepository,
} from "../repositories/fight-live-supabase.repository";

import {
  FightOfficialRepository,
} from "../repositories/fight-official.repository";

import {
  FightResultRepository,
} from "../repositories/fight-result.repository";

import {
  FightStatisticsRepository,
} from "../repositories/fight-statistics.repository";

import {
  FightTimerRepository,
} from "../repositories/fight-timer.repository";

import {
  ScoringRuleRepository,
} from "../repositories/scoring-rule.repository";

import {
  FightDecisionService,
} from "../services/fight-decision.service";

import {
  FightJudgeService,
} from "../services/fight-judge.service";

import {
  FightLiveIntegrationService,
} from "../services/fight-live-integration.service";

import {
  FightLiveRealtimeService,
} from "../services/fight-live-realtime.service";

import {
  FightLiveService,
} from "../services/fight-live.service";

import {
  FightResultService,
} from "../services/fight-result.service";

import {
  FightTimerService,
} from "../services/fight-timer.service";

import {
  ScoringEngineService,
} from "../services/scoring-engine.service";

import {
  ScoringRuleService,
} from "../services/scoring-rule.service";

import {
  CalculateDecisionUseCase,
} from "../use-cases/calculate-decision.use-case";

import {
  EndRoundUseCase,
} from "../use-cases/end-round.use-case";

import {
  ManageFightLiveUseCase,
} from "../use-cases/manage-fight-live.use-case";

import {
  PauseFightUseCase,
} from "../use-cases/pause-fight.use-case";

import {
  PublishResultUseCase,
} from "../use-cases/publish-result.use-case";

import {
  RegisterFightEventUseCase,
} from "../use-cases/register-fight-event.use-case";

import {
  ResumeFightUseCase,
} from "../use-cases/resume-fight.use-case";

import {
  StartFightUseCase,
} from "../use-cases/start-fight.use-case";

import {
  SubmitJudgeCardUseCase,
} from "../use-cases/submit-judge-card.use-case";


let featureUseCase:
  ManageFightLiveUseCase | undefined;


export function createFightLiveFeatureUseCase():
  ManageFightLiveUseCase {

  featureUseCase ??=
    new ManageFightLiveUseCase(
      new FightLiveIntegrationService(
        new FightLiveSupabaseRepository(
          createSupabaseBrowserClient(),
        ),
      ),
    );


  return featureUseCase;
}


export function createFightLiveRealtimeService():
  FightLiveRealtimeService {

  const supabase =
    createSupabaseBrowserClient();


  const observability =
    createRealtimeObservabilityService(
      supabase,
    );


  return new FightLiveRealtimeService(
    new FightLiveRealtimeRepository(
      supabase,
      observability,
    ),
  );
}


export function createFightLiveContainer() {

  const supabase =
    createSupabaseBrowserClient();


  const timerRepository =
    new FightTimerRepository(
      supabase,
    );


  const eventRepository =
    new FightEventRepository(
      supabase,
    );


  const resultRepository =
    new FightResultRepository(
      supabase,
    );


  const judgeRepository =
    new FightJudgeRepository(
      supabase,
    );


  const officialRepository =
    new FightOfficialRepository(
      supabase,
    );


  const statisticsRepository =
    new FightStatisticsRepository(
      supabase,
    );


  const scoringRuleRepository =
    new ScoringRuleRepository(
      supabase,
    );


  const timerService =
    new FightTimerService(
      timerRepository,
    );


  const scoringRuleService =
    new ScoringRuleService(
      scoringRuleRepository,
    );


  const scoringEngineService =
    new ScoringEngineService();


  const judgeService =
    new FightJudgeService(
      judgeRepository,
    );


  const resultService =
    new FightResultService(
      resultRepository,
    );


  const decisionService =
    new FightDecisionService(
      scoringRuleService,
      scoringEngineService,
    );


  const liveService =
    new FightLiveService(
      eventRepository,
      timerRepository,
      judgeRepository,
      officialRepository,
      statisticsRepository,
      resultRepository,
    );


  return {
    services: {
      liveService,
      timerService,
      judgeService,
      resultService,
      decisionService,
      scoringRuleService,
      scoringEngineService,
    },

    useCases: {
      startFightUseCase:
        new StartFightUseCase(
          timerService,
        ),

      registerFightEventUseCase:
        new RegisterFightEventUseCase(
          eventRepository,
        ),

      pauseFightUseCase:
        new PauseFightUseCase(
          timerService,
        ),

      resumeFightUseCase:
        new ResumeFightUseCase(
          timerService,
        ),

      endRoundUseCase:
        new EndRoundUseCase(
          timerService,
        ),

      submitJudgeCardUseCase:
        new SubmitJudgeCardUseCase(
          judgeService,
        ),

      calculateDecisionUseCase:
        new CalculateDecisionUseCase(
          decisionService,
        ),

      publishResultUseCase:
        new PublishResultUseCase(
          resultService,
        ),
    },
  };
}