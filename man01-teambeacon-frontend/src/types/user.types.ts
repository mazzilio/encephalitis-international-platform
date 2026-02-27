/**
 * User type definitions
 */

export type UserRole = 'patient' | 'caregiver' | 'professional' | null;

export interface RoleInfo {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
}

export const ROLE_DEFINITIONS: Record<Exclude<UserRole, null>, RoleInfo> = {
  patient: {
    id: 'patient',
    title: 'I have encephalitis',
    description: 'I am directly affected by encephalitis and looking for support and resources.',
    icon: '/assets/icons/brain-icon.svg',
  },
  caregiver: {
    id: 'caregiver',
    title: 'I am a carer or family member',
    description: 'I care for or support someone affected by encephalitis',
    icon: '/assets/icons/heart-icon.svg',
  },
  professional: {
    id: 'professional',
    title: 'I am a healthcare professional',
    description: 'I am a doctor, nurse, therapist, or researcher seeking information',
    icon: '/assets/icons/stethoscope-icon.svg',
  },
} as const;
