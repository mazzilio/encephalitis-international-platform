/**
 * Application-wide constants
 * Includes Encephalitis International branding and contact information
 */

export const ENCEPHALITIS_INTERNATIONAL = {
  name: 'Encephalitis International',
  tagline: 'The brain inflammation charity',
  website: 'https://www.encephalitis.info/',
  helpline: '+44 (0) 1653 699 599',
  email: 'support@encephalitis.info',
  charityNumber: 'Registered Charity No. 1087843',
  charityNumberScotland: 'SC048210',
  companyNumber: 'Registered in England and Wales No. 04189027',
} as const;

export const RESOURCES = {
  whatIsEncephalitis: 'https://www.encephalitis.info/about-encephalitis/what-is-encephalitis/',
  libraryOfResources: 'https://www.encephalitis.info/about-encephalitis/library-of-resources/',
  supportGroups: 'https://www.encephalitis.info/get-help/connect-with-others/',
  podcast: 'https://www.encephalitis.info/get-help/hear-from-others/the-encephalitis-podcast/',
  typesOfEncephalitis: 'https://www.encephalitis.info/about-encephalitis/types-of-encephalitis/',
  recovery: 'https://www.encephalitis.info/about-encephalitis/recovery-from-encephalitis/',
  forCarers: 'https://www.encephalitis.info/about-encephalitis/library-of-resources/information-for-carers/',
  professionalResources: 'https://www.encephalitis.info/professionals/resources-for-professionals/',
} as const;

export const EMERGENCY_MESSAGE = 
  'If you are experiencing severe symptoms or a medical emergency, call emergency services immediately.';

export const MEDICAL_DISCLAIMER = 
  'This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.';

export const APP_ROUTES = {
  home: '/',
  roleSelection: '/select-role',
  patientJourney: '/patient-journey',
  caregiverJourney: '/caregiver-journey',
  professionalJourney: '/professional-journey',
  results: '/results',
  searchResults: '/search-results',
} as const;
