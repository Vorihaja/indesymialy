"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { makeGetCurrentUserUseCase } from "../factories"

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const useCase = makeGetCurrentUserUseCase()
        setUser(await useCase.execute())
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : "Une erreur inattendue est survenue.")
      } finally {
        setLoading(false)
      }
    }

    void loadUser()
  }, [])

  return { user, loading, error }
}