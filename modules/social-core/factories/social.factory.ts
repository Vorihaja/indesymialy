import { SocialRepository } from "../repositories/social.repository"; import { SocialService } from "../services/social.service"; import { ManageSocialUseCase } from "../use-cases/manage-social.use-case";
export const createSocialUseCase = (namespace: string) => new ManageSocialUseCase(new SocialService(new SocialRepository(namespace)));
