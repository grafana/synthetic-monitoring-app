import { ProbeMetadata, ProbeProvider } from 'types';

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

export const PROBES_METADATA: ProbeMetadata[] = [
  {
    name: 'Bangalore',
    displayName: `Bangalore`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_IN.code,
    country: COUNTRY_IN.long,
  },
  {
    name: 'Mumbai',
    displayName: `Mumbai`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_IN.code,
    country: COUNTRY_IN.long,
  },
  {
    name: 'Seoul',
    displayName: `Seoul`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_KR.code,
    country: COUNTRY_KR.long,
  },
  {
    name: 'Singapore',
    displayName: `Singapore`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_SG.code,
    country: COUNTRY_SG.long,
  },
  {
    name: 'Sydney',
    displayName: `Sydney`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_AU.code,
    country: COUNTRY_AU.long,
  },
  {
    name: 'Tokyo',
    displayName: `Tokyo`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_JP.code,
    country: COUNTRY_JP.long,
  },

  {
    name: 'Atlanta',
    displayName: `Atlanta`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Dallas',
    displayName: `Dallas`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Newark',
    displayName: `Newark`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Toronto',
    displayName: `Toronto`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.LINODE,
    countryCode: COUNTRY_CA.code,
    country: COUNTRY_CA.long,
  },
  {
    name: 'NewYork',
    displayName: `New York`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'SanFrancisco',
    displayName: `San Francisco`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'NorthCalifornia',
    displayName: `North California`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'NorthVirginia',
    displayName: `North Virginia`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Ohio',
    displayName: `Ohio`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'Oregon',
    displayName: `Oregon`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_US.code,
    country: COUNTRY_US.long,
  },
  {
    name: 'SaoPaulo',
    displayName: `Sao Paulo`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_BR.code,
    country: COUNTRY_BR.long,
  },

  {
    name: 'Amsterdam',
    displayName: `Amsterdam`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.DIGITAL_OCEAN,
    countryCode: COUNTRY_NL.code,
    country: COUNTRY_NL.long,
  },
  {
    name: 'CapeTown',
    displayName: `Cape Town`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_ZA.code,
    country: COUNTRY_ZA.long,
  },
  {
    name: 'Frankfurt',
    displayName: `Frankfurt`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_DE.code,
    country: COUNTRY_DE.long,
  },
  {
    name: 'London',
    displayName: `London`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_UK.code,
    country: COUNTRY_UK.long,
  },
  {
    name: 'Paris',
    displayName: `Paris`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_FR.code,
    country: COUNTRY_FR.long,
  },
  {
    name: 'Zurich',
    displayName: `Zurich`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_CH.code,
    country: COUNTRY_CH.long,
  },
  {
    name: 'Stockholm',
    displayName: `Stockholm`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_SE.code,
    country: COUNTRY_SE.long,
  },
  {
    name: 'Montreal',
    displayName: `Montreal`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_CA.code,
    country: COUNTRY_CA.long,
  },
  {
    name: 'Calgary',
    displayName: `Calgary`,
    region: REGION_AMER.code,
    longRegion: REGION_AMER.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_CA.code,
    country: COUNTRY_CA.long,
  },
  {
    name: 'UAE',
    displayName: `UAE`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_AE.code,
    country: COUNTRY_AE.long,
  },
  {
    name: 'Hyderabad',
    displayName: `Hyderabad`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_IN.code,
    country: COUNTRY_IN.long,
  },
  {
    name: 'Spain',
    displayName: `Spain`,
    region: REGION_EMEA.code,
    longRegion: REGION_EMEA.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_ES.code,
    country: COUNTRY_ES.long,
  },
  {
    name: 'Jakarta',
    displayName: `Jakarta`,
    region: REGION_APAC.code,
    longRegion: REGION_APAC.long,
    provider: ProbeProvider.AWS,
    countryCode: COUNTRY_ID.code,
    country: COUNTRY_ID.long,
  },
];
