import { UserRepository } from "../repositories/user.repository"
import type { UpdateUserProfile } from "../types"

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async getProfile(userId: string) {
    return this.repository.findById(userId)
  }

  async updateProfile(userId: string, data: UpdateUserProfile) {
    return this.repository.update(userId, data)
  }

  async getCurrentUser() {
    return this.repository.getCurrentUser()
  }
}