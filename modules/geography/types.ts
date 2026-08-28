export interface GeographyRegion { id: string; name: string; slug: string }
export interface GeographyDistrict { id: string; regionId: string; name: string; slug: string }
export interface GeographyCity { id: string; regionId: string; districtId: string | null; name: string; slug: string }
export interface GeographyCommune { id: string; regionId: string; districtId: string; cityId: string | null; name: string; slug: string }
export interface GeographySnapshot { regions: GeographyRegion[]; districts: GeographyDistrict[]; cities: GeographyCity[]; communes: GeographyCommune[] }
export interface GeographyValue { regionId: string; districtId: string; cityId: string; communeId: string }
