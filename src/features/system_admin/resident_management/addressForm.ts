export interface ResidentAddressFields {
  houseUnitBuilding: string
  streetName: string
  subdivisionPhasePurok: string
  barangay: string
  cityMunicipality: string
  provinceRegion: string
}

export const DEFAULT_RESIDENT_ADDRESS: ResidentAddressFields = {
  houseUnitBuilding: '',
  streetName: '',
  subdivisionPhasePurok: '',
  barangay: 'Ugong',
  cityMunicipality: 'Valenzuela City',
  provinceRegion: 'Metro Manila',
}

const normalizeAddressToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/\bbarangay\b/g, '')
    .replace(/\bbrgy\.?\b/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const matchesDefaultToken = (value: string, expected: string) =>
  normalizeAddressToken(value) === normalizeAddressToken(expected)

const LOCATION_SEGMENTS = [
  'Barangay Ugong',
  'Brgy. Ugong',
  'Ugong',
  'Valenzuela City',
  'Pasig City',
  'Metro Manila',
]

const hasStreetKeyword = (value: string) =>
  /\b(street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|highway|hwy\.?)\b/i.test(value)

const hasSubdivisionKeyword = (value: string) =>
  /\b(subdivision|subd\.?|phase|purok|sitio|village|blk\.?|block|lot)\b/i.test(value)

const hasHouseKeyword = (value: string) =>
  /\b(house|unit|building|bldg\.?|apt\.?|apartment|room|rm\.?|door|no\.?|#)\b/i.test(value)

export const buildCompleteAddress = (address: ResidentAddressFields) =>
  [
    address.houseUnitBuilding.trim(),
    address.streetName.trim(),
    address.subdivisionPhasePurok.trim(),
    address.barangay.trim(),
    address.cityMunicipality.trim(),
    address.provinceRegion.trim(),
  ]
    .filter(Boolean)
    .join(', ')

export const parseCompleteAddress = (completeAddress?: string): ResidentAddressFields => {
  const parsed = { ...DEFAULT_RESIDENT_ADDRESS }
  const segments = (completeAddress ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !LOCATION_SEGMENTS.some((location) => matchesDefaultToken(segment, location)))

  if (segments.length === 0) return parsed

  if (segments.length === 1) {
    const [single] = segments
    if (hasStreetKeyword(single)) {
      parsed.streetName = single
    } else {
      parsed.subdivisionPhasePurok = single
    }
    return parsed
  }

  if (segments.length === 2) {
    const [first, second] = segments
    if (hasHouseKeyword(first) && hasStreetKeyword(second)) {
      parsed.houseUnitBuilding = first
      parsed.streetName = second
      return parsed
    }

    if (hasStreetKeyword(first) && hasSubdivisionKeyword(second)) {
      parsed.streetName = first
      parsed.subdivisionPhasePurok = second
      return parsed
    }

    if (hasHouseKeyword(first)) {
      parsed.houseUnitBuilding = first
      parsed.subdivisionPhasePurok = second
      return parsed
    }

    if (hasStreetKeyword(second)) {
      parsed.houseUnitBuilding = first
      parsed.streetName = second
      return parsed
    }

    parsed.streetName = first
    parsed.subdivisionPhasePurok = second
    return parsed
  }

  parsed.houseUnitBuilding = segments[0] ?? ''
  parsed.streetName = segments[1] ?? ''
  parsed.subdivisionPhasePurok = segments.slice(2).join(', ')

  return parsed
}
