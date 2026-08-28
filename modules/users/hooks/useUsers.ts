"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { GetCurrentUserUseCase } from "../use-cases/get-current-user.use-case"

export function useUser(useCase: GetCurrentUserUseCase) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setUser(await useCase.execute())
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [useCase])

  return { user, loading }
}