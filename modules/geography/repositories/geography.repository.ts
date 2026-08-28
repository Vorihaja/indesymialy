import type { GeographySnapshot } from "../types";
export interface GeographyRepository { load(): Promise<GeographySnapshot> }
