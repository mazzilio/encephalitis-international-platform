import { MockProfile } from '../types';

export const MOCK_INBOX: MockProfile[] = [
    {
        id: "web_chat_992",
        name: "Alice Vane",
        email: "alice.v@gmail.com",
        role: "Patient",
        diagnosis: "Anti-LGI1",
        stage: "Early Recovery",
        recentNotes: "Completed web triage: 'I have just been discharged. The memory loss is frightening. Is it normal to forget my children's names momentarily?'",
        lastContact: "10 mins ago"
    },
    {
        id: "web_chat_991",
        name: "Greg Houseman",
        email: "g.houseman@outlook.com",
        role: "Caregiver",
        diagnosis: "HSV Encephalitis",
        stage: "Long-term Management",
        recentNotes: "Completed web triage: 'Wife had HSV 2 years ago. Her anger outbursts are getting worse, not better. Need legal advice regarding power of attorney.'",
        lastContact: "1 hour ago"
    },
    {
        id: "web_chat_988",
        name: "Sarah & Tom",
        email: "sarah.tom@family.com",
        role: "Parent",
        diagnosis: "Autoimmune (Unspecified)",
        stage: "Acute Hospital",
        recentNotes: "Completed web triage: 'Our son is in a coma. Doctors are mentioning Rituximab. We need to understand the side effects ASAP.'",
        lastContact: "3 hours ago"
    }
];

export const MOCK_PROFILES: MockProfile[] = [
    {
        id: "crm_001",
        name: "Miriam Al-Fayed",
        email: "miriam.af@example.com",
        role: "Caregiver",
        diagnosis: "Anti-NMDAR Encephalitis",
        stage: "Acute Hospital",
        recentNotes: "Husband currently in ICU. Showing extreme agitation and aggression. Miriam is frightened and doesn't understand the behavioral changes.",
        lastContact: "2 days ago"
    },
    {
        id: "crm_002",
        name: "John Smith",
        email: "j.smith88@example.com",
        role: "Patient",
        diagnosis: "HSV Encephalitis",
        stage: "Early Recovery",
        recentNotes: "Discharged 3 weeks ago. Struggling significantly with short-term memory loss. Worried about returning to work as an accountant.",
        lastContact: "1 week ago"
    },
    {
        id: "crm_003",
        name: "Sarah Jenkins",
        email: "s.jenkins@example.com",
        role: "Parent",
        diagnosis: "Autoimmune Encephalitis (Unspecified)",
        stage: "Long-term Management",
        recentNotes: "Daughter (age 14) is back in school but failing classes. Teachers don't understand her fatigue and cognitive slowness. Needs an IEP guide.",
        lastContact: "3 months ago"
    },
    {
        id: "crm_004",
        name: "Dr. Aris Thorne",
        email: "athorne@clinic.example.com",
        role: "Professional",
        diagnosis: "General Encephalitis",
        stage: "Post-Diagnosis",
        recentNotes: "GP looking for patient-friendly leaflets to explain the difference between viral and autoimmune causes to a family.",
        lastContact: "Yesterday"
    },
    {
        id: "crm_005",
        name: "Emily Chen",
        email: "emily.c@example.com",
        role: "Bereaved",
        diagnosis: "Japanese Encephalitis",
        stage: "Bereavement",
        recentNotes: "Lost her brother 6 months ago. Feeling 'stuck' in grief. Asking about local support groups or counseling specifically for encephalitis loss.",
        lastContact: "1 month ago"
    },
    {
        id: "crm_006",
        name: "Marcus Johnson",
        email: "mj_fitness@example.com",
        role: "Patient",
        diagnosis: "LGI1 Antibody Encephalitis",
        stage: "Long-term Management",
        recentNotes: "Experiencing focal seizures despite medication. Wants to know about dietary changes or lifestyle adjustments that might help.",
        lastContact: "4 days ago"
    },
    {
        id: "crm_007",
        name: "Elena Rodriguez",
        email: "elena.r@example.com",
        role: "Caregiver",
        diagnosis: "Hashimoto's Encephalopathy",
        stage: "Pre-diagnosis / Testing",
        recentNotes: "Doctors are dismissing symptoms as psychiatric. Needs information on how to advocate for proper antibody testing.",
        lastContact: "Today"
    },
    {
        id: "crm_008",
        name: "David O'Connell",
        email: "doc.oconnell@example.com",
        role: "Patient",
        diagnosis: "West Nile Virus",
        stage: "Early Recovery",
        recentNotes: "Physical fatigue is overwhelming. Can't walk more than 10 minutes. Needs reassurance about recovery timelines.",
        lastContact: "2 weeks ago"
    },
    {
        id: "crm_009",
        name: "Priya Patel",
        email: "ppatel@example.com",
        role: "Parent",
        diagnosis: "Rasmussen's Encephalitis",
        stage: "Acute Hospital",
        recentNotes: "Facing potential hemispherectomy surgery for son. Needs simple guides to explain the surgery and outcomes to family members.",
        lastContact: "Yesterday"
    },
    {
        id: "crm_010",
        name: "Thomas Mueller",
        email: "t.mueller@example.com",
        role: "Caregiver",
        diagnosis: "Anti-GABA-B",
        stage: "Early Recovery",
        recentNotes: "Wife is home but personality is completely different. Apathy and lack of emotion. Thomas feels like he's living with a stranger.",
        lastContact: "5 days ago"
    }
];