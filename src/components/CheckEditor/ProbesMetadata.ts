import { ProbeProvider } from 'types';

const REGION_APAC = { code: 'APAC', long: 'Asia-Pacific' };
const REGION_AMER = { code: 'AMER', long: 'The Americas' };
const REGION_EMEA = { code: 'EMEA', long: 'Europe, M. East & Africa' };

const COUNTRY_IN = { code: 'IN', long: 'India' };
const COUNTRY_KR = { code: 'KR', long: 'South Korea' };
const COUNTRY_SG = { code: 'SG', long: 'Singapore' };
const COUNTRY_AU = { code: 'AU', long: 'Australia' };
const COUNTRY_JP = { code: 'JP', long: 'Japan' };
const COUNTRY_US = { code: 'US', long: 'United States' };
const COUNTRY_CA = { code: 'CA', long: 'Canada' };
const COUNTRY_BR = { code: 'BR', long: 'Brazil' };
const COUNTRY_NL = { code: 'NL', long: 'Netherlands' };
const COUNTRY_ZA = { code: 'ZA', long: 'South Africa' };
const COUNTRY_DE = { code: 'DE', long: 'Germany' };
const COUNTRY_UK = { code: 'UK', long: 'United Kingdom' };
const COUNTRY_FR = { code: 'FR', long: 'France' };
const COUNTRY_CH = { code: 'CH', long: 'Switzerland' };
const COUNTRY_SE = { code: 'SE', long: 'Sweden' };
const COUNTRY_AE = { code: 'AE', long: 'United Arab Emirates' };
const COUNTRY_ES = { code: 'ES', long: 'Spain' };
const COUNTRY_ID = { code: 'ID', long: 'Indonesia' };

export const PROBES_METADATA = [
  {
    name: 'Bangalore',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_IN.code,
    country: COUNTRY_IN.long,
  },
  {
    name: 'Mumbai',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_IN.code,
    country: COUNTRY_IN.long,
  },
  {
    name: 'Seoul',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_KR.code,
    country: COUNTRY_KR.long,
  },
  {
    name: 'Singapore',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_SG.code,
    country: COUNTRY_SG.long,
  },
  {
    name: 'Sydney',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_AU.code,
    country: COUNTRY_AU.long,
  },
  {
    name: 'Tokyo',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_JP.code,
    country: COUNTRY_JP.long,
  },

  {
    name: 'Atlanta',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Dallas',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Newark',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Toronto',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_CA.code,
    country: COUNTRY_CA.long,
  },
  {
    name: 'NewYork',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'SanFrancisco',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'NorthCalifornia',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'NorthVirginia',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Ohio',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Oregon',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'SaoPaulo',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_BR.code,
    country: COUNTRY_BR.long,
  },

  {
    name: 'Amsterdam',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_NL.code,
    country: COUNTRY_NL.long,
  },
  {
    name: 'CapeTown',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_ZA.code,
    country: COUNTRY_ZA.long,
  },
  {
    name: 'Frankfurt',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_DE.code,
    country: COUNTRY_DE.long,
  },
  {
    name: 'London',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_UK.code,
    country: COUNTRY_UK.long,
  },
  {
    name: 'Paris',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_FR.code,
    country: COUNTRY_FR.long,
  },
  {
    name: 'Zurich',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_CH.code,
    country: COUNTRY_CH.long,
  },
  {
    name: 'Stockholm',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_SE.code,
    country: COUNTRY_SE.long,
  },
  {
    name: 'Montreal',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_CA.code,
    country: COUNTRY_CA.long,
  },
  {
    name: 'Calgary',
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_CA.code,
    country: COUNTRY_CA.long,
  },
  {
    name: 'UAE',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_AE.code,
    country: COUNTRY_AE.long,
  },
  {
    name: 'Hyderabad',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_IN.code,
    country: COUNTRY_IN.long,
  },
  {
    name: 'Spain',
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_ES.code,
    country: COUNTRY_ES.long,
  },
  {
    name: 'Jakarta',
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_ID.code,
    country: COUNTRY_ID.long,
  },
];
