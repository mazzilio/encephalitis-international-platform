import { Resource, DraftResponse } from '../types';
import { mockSuggestResources, mockGenerateDraft } from './mock-api';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;
const USE_MOCK = !API_ENDPOINT || import.meta.env.VITE_USE_MOCK === 'true';

if (!API_ENDPOINT) {
    console.warn('VITE_API_ENDPOINT is not set. Using mock API for local development.');
}

export const suggestResources = async (
    userProfile: string,
    databaseContent: string | null
): Promise<Resource[]> => {
    // Use mock API if no endpoint configured
    if (USE_MOCK) {
        console.log('Using mock API for resource suggestion');
        return mockSuggestResources(userProfile, databaseContent);
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/suggest-resources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userProfile,
                databaseContent
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to retrieve resources');
        }

        const data = await response.json();
        return data.resources;
    } catch (error: any) {
        console.error('AWS Bedrock Suggestion Error:', error);
        throw new Error(error.message || 'Failed to retrieve resources. Please try again.');
    }
};

export const generateDraft = async (
    userProfile: string,
    selectedResources: Resource[]
): Promise<DraftResponse> => {
    // Use mock API if no endpoint configured
    if (USE_MOCK) {
        console.log('Using mock API for draft generation');
        return mockGenerateDraft(userProfile, selectedResources);
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/generate-draft`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userProfile,
                selectedResources
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate draft');
        }

        const data = await response.json();
        return data.draft;
    } catch (error: any) {
        console.error('AWS Bedrock Draft Error:', error);
        throw new Error(error.message || 'Failed to generate email draft.');
    }
};

export const uploadKnowledgeBase = async (
    fileName: string,
    fileContent: string
): Promise<void> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/upload-knowledge-base`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName,
                fileContent
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload knowledge base');
        }
    } catch (error: any) {
        console.error('Upload Error:', error);
        throw new Error(error.message || 'Failed to upload knowledge base.');
    }
};
