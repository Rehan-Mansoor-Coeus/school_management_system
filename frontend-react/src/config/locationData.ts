export type CountryOption = { code: string; name: string }

const PRIORITY = ['Uganda', 'Rwanda', 'Kenya', 'Cameroon', 'Nigeria']

const ALL_COUNTRIES: CountryOption[] = [
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'CD', name: 'Democratic Republic of the Congo' },
  { code: 'CG', name: 'Republic of the Congo' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'NE', name: 'Niger' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'ML', name: 'Mali' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'BJ', name: 'Benin' },
  { code: 'TG', name: 'Togo' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'LR', name: 'Liberia' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'LY', name: 'Libya' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SO', name: 'Somalia' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'MW', name: 'Malawi' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'BW', name: 'Botswana' },
  { code: 'NA', name: 'Namibia' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'AO', name: 'Angola' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AU', name: 'Australia' },
]

export const countryOptions: CountryOption[] = [
  ...ALL_COUNTRIES.filter((c) => PRIORITY.includes(c.name)),
  ...ALL_COUNTRIES.filter((c) => !PRIORITY.includes(c.name)).sort((a, b) => a.name.localeCompare(b.name)),
]

export const DEFAULT_COUNTRY = 'Uganda'
export const DEFAULT_CITY_BY_COUNTRY: Record<string, string> = {
  Uganda: 'Kampala',
  Rwanda: 'Kigali',
  Kenya: 'Nairobi',
  Cameroon: 'Yaoundé',
  Nigeria: 'Abuja',
  'United States': 'Washington',
}

type SubdivisionConfig = { label: string; items: string[] }

export const subdivisionsByCountry: Record<string, SubdivisionConfig> = {
  Uganda: {
    label: 'District',
    items: [
      'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbale', 'Gulu', 'Lira', 'Mbarara', 'Fort Portal', 'Kabale',
      'Masaka', 'Entebbe', 'Arua', 'Soroti', 'Hoima', 'Kasese', 'Iganga', 'Tororo', 'Bushenyi', 'Other',
    ],
  },
  Rwanda: {
    label: 'Province',
    items: ['Kigali', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province', 'Other'],
  },
  Kenya: {
    label: 'County',
    items: [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado', 'Meru', 'Other',
    ],
  },
  Cameroon: {
    label: 'Region',
    items: [
      'Adamawa', 'Centre', 'East', 'Far North', 'Littoral', 'North', 'Northwest', 'South', 'Southwest', 'West', 'Other',
    ],
  },
  Nigeria: {
    label: 'State',
    items: [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
      'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
      'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
      'Taraba', 'Yobe', 'Zamfara', 'Other',
    ],
  },
  'United States': {
    label: 'State',
    items: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida',
      'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
      'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
      'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
      'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Other',
    ],
  },
}

export const citiesByCountry: Record<string, string[]> = {
  Uganda: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara', 'Mbale', 'Fort Portal', 'Masaka', 'Other'],
  Rwanda: ['Kigali', 'Huye', 'Musanze', 'Rubavu', 'Nyagatare', 'Other'],
  Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Other'],
  Cameroon: ['Yaoundé', 'Douala', 'Bamenda', 'Buea', 'Garoua', 'Other'],
  Nigeria: ['Abuja', 'Lagos', 'Kano', 'Ibadan', 'Port Harcourt', 'Other'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Washington', 'Other'],
}

export function getSubdivisionConfig(country: string): SubdivisionConfig {
  return subdivisionsByCountry[country] || { label: 'State / Region', items: [] }
}

export function getCityOptions(country: string): string[] {
  return citiesByCountry[country] || []
}

export function defaultCityForCountry(country: string): string {
  return DEFAULT_CITY_BY_COUNTRY[country] || ''
}
