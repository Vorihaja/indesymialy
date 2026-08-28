"use client"

import { useEffect, useState } from "react"
import { makeGetProfileUseCase } from "../factories"
import type { UserProfile } from "../types"

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setProfile(null)
        setLoading(false)
      })
      return
    }

    async function loadProfile(id: string) {
      const useCase = makeGetProfileUseCase()
      const result = await useCase.execute(id)
      setProfile(result)
      setLoading(false)
    }

    void loadProfile(userId)
  }, [userId])

  return { profile, loading }
}