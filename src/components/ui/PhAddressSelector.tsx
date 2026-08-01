import { useEffect, useState } from 'react'
import {
  regions,
  provinces,
  cities,
  barangays,
} from 'select-philippines-address'

export interface PhAddressValue {
  houseStreet: string
  regionCode: string
  regionName: string
  provinceCode: string
  provinceName: string
  cityCode: string
  cityName: string
  barangayCode: string
  barangayName: string
  fullAddress?: string
}

interface PhAddressSelectorProps {
  labelPrefix?: string
  value?: Partial<PhAddressValue>
  onChange: (val: PhAddressValue) => void
  className?: string
}

interface OptionItem {
  code: string
  name: string
  displayName?: string
}

const inputCls =
  'w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-800 bg-slate-50/50 focus:bg-white cursor-pointer shadow-2xs truncate'

/**
 * Clean location name formatter for user-friendly readability.
 * Keeps standard names like "NCR, Third District", "Valenzuela City", "Barangay Ugong".
 */
export function formatLocationName(rawName: string): string {
  if (!rawName) return ''
  const str = rawName.trim()

  // Clean NCR District labels
  if (/ncr,\s*third\s*district/i.test(str)) {
    return 'NCR, Third District'
  }
  if (/ncr,\s*first\s*district/i.test(str)) {
    return 'NCR, First District (Manila)'
  }
  if (/ncr,\s*second\s*district/i.test(str)) {
    return 'NCR, Second District'
  }
  if (/ncr,\s*fourth\s*district/i.test(str)) {
    return 'NCR, Fourth District'
  }

  // "City Of X" -> "X City"
  if (/^city of /i.test(str)) {
    const cityName = str.replace(/^city of /i, '').trim()
    return `${toTitleCase(cityName)} City`
  }

  return toTitleCase(str)
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase()
      if (lower === 'of' || lower === 'in') return lower
      if (
        [
          'ncr',
          'iii',
          'ii',
          'iv-a',
          'iv-b',
          'vi',
          'vii',
          'viii',
          'ix',
          'xi',
          'xii',
          'xiii',
          'car',
          'armm',
          'barmm',
        ].includes(lower)
      ) {
        return lower.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function PhAddressSelector({
  labelPrefix = '',
  value,
  onChange,
  className = '',
}: PhAddressSelectorProps) {
  const [houseStreet, setHouseStreet] = useState(value?.houseStreet || '')

  const [provinceList, setProvinceList] = useState<OptionItem[]>([])
  const [cityList, setCityList] = useState<OptionItem[]>([])
  const [barangayList, setBarangayList] = useState<OptionItem[]>([])

  const [selectedRegion, setSelectedRegion] = useState<OptionItem>({
    code: '13',
    name: 'National Capital Region (NCR)',
  })
  const [selectedProvince, setSelectedProvince] = useState<OptionItem>({ code: '', name: '' })
  const [selectedCity, setSelectedCity] = useState<OptionItem>({ code: '', name: '' })
  const [selectedBarangay, setSelectedBarangay] = useState<OptionItem>({ code: '', name: '' })

  // 1. Initialize Region to NCR (code '13')
  useEffect(() => {
    let isMounted = true
    regions().then((data: any[]) => {
      if (!isMounted) return
      const ncr = data.find((r) => r.region_code === '13') || {
        region_code: '13',
        region_name: 'National Capital Region (NCR)',
      }
      setSelectedRegion({
        code: ncr.region_code,
        name: ncr.region_name,
      })
    })
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Load Provinces for NCR
  useEffect(() => {
    if (!selectedRegion.code) return
    let isMounted = true
    provinces(selectedRegion.code).then((data: any[]) => {
      if (!isMounted) return
      const mapped = data.map((p) => ({
        code: p.province_code,
        name: p.province_name,
        displayName: formatLocationName(p.province_name),
      }))
      setProvinceList(mapped)

      // Auto-fill / Default to 3rd district (Valenzuela District)
      const defaultProv =
        mapped.find((p) => p.name.toLowerCase().includes('third district')) ||
        mapped[0] || { code: '', name: '' }
      setSelectedProvince(defaultProv)
    })
    return () => {
      isMounted = false
    }
  }, [selectedRegion.code])

  // 3. Load Cities for Selected Province (Default: Valenzuela City)
  useEffect(() => {
    if (!selectedProvince.code) return
    let isMounted = true
    cities(selectedProvince.code).then((data: any[]) => {
      if (!isMounted) return
      const mapped = data.map((c) => ({
        code: c.city_code,
        name: c.city_name,
        displayName: formatLocationName(c.city_name),
      }))
      setCityList(mapped)

      // Auto-fill / Default to Valenzuela City
      const valenzuela =
        mapped.find((c) => c.name.toLowerCase().includes('valenzuela')) ||
        mapped[0] || { code: '', name: '' }
      setSelectedCity(valenzuela)
    })
    return () => {
      isMounted = false
    }
  }, [selectedProvince.code])

  // 4. Load Barangays for Selected City (Default: Barangay Ugong)
  useEffect(() => {
    if (!selectedCity.code) return
    let isMounted = true
    barangays(selectedCity.code).then((data: any[]) => {
      if (!isMounted) return
      const mapped = data.map((b) => ({
        code: b.brgy_code,
        name: b.brgy_name,
        displayName: formatLocationName(b.brgy_name),
      }))
      setBarangayList(mapped)

      // Auto-fill / Default to Ugong
      const ugong =
        mapped.find((b) => b.name.toLowerCase().includes('ugong')) ||
        mapped[0] || { code: '', name: '' }
      setSelectedBarangay(ugong)
    })
    return () => {
      isMounted = false
    }
  }, [selectedCity.code])

  // Notify parent on state updates
  const emitChange = (
    hs: string,
    reg: OptionItem,
    prov: OptionItem,
    cit: OptionItem,
    brgy: OptionItem
  ) => {
    const formattedBrgy = formatLocationName(brgy.name)
    const formattedCity = formatLocationName(cit.name)
    const formattedProv = formatLocationName(prov.name)

    const full = [
      hs,
      formattedBrgy ? `Brgy. ${formattedBrgy}` : '',
      formattedCity,
      formattedProv,
      'National Capital Region (NCR)',
    ]
      .filter(Boolean)
      .join(', ')

    onChange({
      houseStreet: hs,
      regionCode: reg.code,
      regionName: reg.name,
      provinceCode: prov.code,
      provinceName: prov.name,
      cityCode: cit.code,
      cityName: formattedCity,
      barangayCode: brgy.code,
      barangayName: formattedBrgy,
      fullAddress: full,
    })
  }

  // Handle external prop sync (if parent sets searchQuery or auto-fills)
  useEffect(() => {
    if (value?.houseStreet !== undefined && value.houseStreet !== houseStreet) {
      setHouseStreet(value.houseStreet)
    }
  }, [value?.houseStreet])

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Section Divider Badge */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
          <span className="bg-white px-3 font-semibold">
            {labelPrefix} Address Details
          </span>
        </div>
      </div>

      {/* 4-Column UI/UX Grid: House/Street -> Barangay -> City -> Province/District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Column 1: House No. / Street / Purok */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            House No. / Street / Subd / Purok
          </label>
          <input
            type="text"
            maxLength={100}
            value={houseStreet}
            onChange={(e) => {
              const val = e.target.value
              setHouseStreet(val)
              emitChange(val, selectedRegion, selectedProvince, selectedCity, selectedBarangay)
            }}
            placeholder="e.g. House #12, Purok 8, MH Del Pilar St."
            className={inputCls}
          />
          <div className="flex justify-end mt-1 text-[10px] text-slate-400">
            <span>{houseStreet.length}/100</span>
          </div>
        </div>

        {/* Column 2: Barangay Dropdown (Auto-filled: Barangay Ugong) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Barangay <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBarangay.code}
            onChange={(e) => {
              const item = barangayList.find((b) => b.code === e.target.value) || {
                code: e.target.value,
                name: e.target.value,
              }
              setSelectedBarangay(item)
              emitChange(houseStreet, selectedRegion, selectedProvince, selectedCity, item)
            }}
            className={inputCls}
          >
            {barangayList.map((b) => (
              <option key={b.code} value={b.code}>
                {formatLocationName(b.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Column 3: City / Municipality Dropdown (Auto-filled: Valenzuela City) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            City / Municipality <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCity.code}
            onChange={(e) => {
              const item = cityList.find((c) => c.code === e.target.value) || {
                code: e.target.value,
                name: e.target.value,
              }
              setSelectedCity(item)
              emitChange(houseStreet, selectedRegion, selectedProvince, item, selectedBarangay)
            }}
            className={inputCls}
          >
            {cityList.map((c) => (
              <option key={c.code} value={c.code}>
                {formatLocationName(c.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Column 4: Province / District Dropdown (Auto-filled: NCR, Third District) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Province / District <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProvince.code}
            onChange={(e) => {
              const item = provinceList.find((p) => p.code === e.target.value) || {
                code: e.target.value,
                name: e.target.value,
              }
              setSelectedProvince(item)
              emitChange(houseStreet, selectedRegion, item, selectedCity, selectedBarangay)
            }}
            className={inputCls}
          >
            {provinceList.map((p) => (
              <option key={p.code} value={p.code}>
                {formatLocationName(p.name)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
