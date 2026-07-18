export type Region = { id: string; name: string; cities?: { id: string; name: string }[] }
export type City = { id: string; name: string; region_id?: string }
export const REGIONS_MOCK: Region[] = []