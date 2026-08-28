import type {
  Fighter,
} from "@/modules/fighters/types";

import {
  makeFighterService,
} from "@/modules/fighters/services";



export interface CreateFighterInput {

  data: Partial<Fighter>;

}



export async function createFighterUseCase(
  input: CreateFighterInput,
): Promise<Fighter | null> {


  const service =
    makeFighterService();



  if (!input.data) {

    throw new Error(
      "Fighter data is required",
    );

  }



  return await service.createFighter(

    input.data

  );

}