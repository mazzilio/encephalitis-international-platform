export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface MockProfile {
    id: string;
    name: string;
    email: string;
    role: string; // Patient, Caregiver, etc.
    diagnosis: string;
    stage: string;
    recentNotes: string; // To pre-fill concerns
    lastContact: string;
}

export interface Resource {
    id: string;
    title: string;
    excerpt: string;
    type: 'PDF' | 'Article' | 'Video' | 'Webpage' | 'Book';
    timeToRead: string;
    matchReason: string;
    url: string;
}

export interface DraftResponse {
    subject: string;
    opening: string;
    resourceIntro: string;
    closing: string;
    signOff: string;
}

export interface AppState {
    jsonFileContent: string | null;
    jsonFileName: string | null;
    
    // Workflow State
    step: 'SEARCH' | 'INTAKE' | 'SELECTION' | 'RESULT';
    
    // Form Data
    formData: {
        name: string;
        role: string;
        diagnosis: string;
        stage: string;
        concerns: string;
    };

    // Resource Selection State
    suggestedResources: Resource[];
    selectedResourceIds: string[];

    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    response: DraftResponse | null;
}