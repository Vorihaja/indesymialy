import { z } from "zod";


export const fighterSchema = z.object({

  first_name: z
    .string()
    .min(
      2,
      "Le prénom doit contenir au moins 2 caractères"
    ),


  last_name: z
    .string()
    .min(
      2,
      "Le nom doit contenir au moins 2 caractères"
    ),


  nickname: z
    .string()
    .min(
      2
    )
    .optional(),


  gender: z
    .enum([
      "male",
      "female"
    ])
    .optional(),



  birth_date: z
    .string()
    .optional(),



  nationality: z
    .string()
    .optional(),



  height: z
    .number()
    .positive()
    .optional(),



  weight: z
    .number()
    .positive()
    .optional(),



  reach: z
    .number()
    .positive()
    .optional(),



  fighting_style: z
    .string()
    .optional(),



  category: z
    .string()
    .optional(),



  bio: z
    .string()
    .max(
      2000,
      "La biographie est trop longue"
    )
    .optional(),

});



export type FighterFormData =
  z.infer<typeof fighterSchema>;