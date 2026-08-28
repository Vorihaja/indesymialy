"use client"

import { useState } from "react"
import { makeUpdateProfileUseCase } from "../factories"
import type { UpdateUserProfile } from "../types"

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false)

  async function updateProfile(userId: string, data: UpdateUserProfile) {
    setLoading(true)

    try {
      const useCase = makeUpdateProfileUseCase()
      return await useCase.execute(userId, data)
    } finally {
      setLoading(false)
    }
  }

  return { updateProfile, loading }
}