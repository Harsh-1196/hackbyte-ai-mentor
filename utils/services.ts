import { getTemplate } from './template-manager';

// Updated language codes to match the ones used in page.tsx
const languageCodeMap = {
    cpp: 52,
    python: 71,
    javascript: 63,
    java: 62
};

// Constants for API configuration
const JUDGE0_API_HOST = 'judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY || '';
const SUBMISSION_TIMEOUT = 30000; // 30 seconds
const MAX_POLLING_ATTEMPTS = 10;
const POLLING_INTERVAL = 1000; // 1 second

// Helper function to create API request headers
const getApiHeaders = () => ({
    'x-rapidapi-key': JUDGE0_API_KEY,
    'x-rapidapi-host': JUDGE0_API_HOST,
    'Content-Type': 'application/json'
});

// get a submission
export async function getSubmission(tokenId: string, callback?: (data: any) => void) {
    const url = `https://judge0-ce.p.rapidapi.com/submissions/${tokenId}?base64_encoded=true&fields=*`;
    const options = {
        method: 'GET',
        headers: getApiHeaders()
    };
  
    try {
        const response = await fetch(url, options);
        
        // Check if the response is OK before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            if (callback) {
                callback({apiStatus: 'error', message: `API error: ${response.status} ${response.statusText}`});
            }
            return { error: `API error: ${response.status} ${response.statusText}`, message: errorText };
        }
        
        const result = await response.json();
        return result;
    } catch (error: any) {
        if (callback) {
            callback({apiStatus: 'error', message: JSON.stringify(error)});
        }
        return { error: true, message: String(error) };
    }
}

// Helper function to safely decode base64 strings
export const safeAtob = (base64String: string) => {
    if (!base64String) return '';
    try {
        return atob(base64String);
    } catch (e) {
        console.error('Failed to decode base64 string:', e);
        return '';
    }
};

// Helper function to safely encode strings to base64
export const safeEncode = (text: string) => {
    if (!text) return null;
    try {
        return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
        console.error('Failed to encode string to base64:', e);
        try {
            return btoa(text);
        } catch (e2) {
            console.error('Fallback encoding failed:', e2);
            return null;
        }
    }
};

export const makeSubmission = async ({ 
  code, 
  language, 
  stdin, 
  questionTitle 
}: {
  code: string;
  language: number;
  stdin: string;
  questionTitle: string;
}) => {
  try {
    // Get the appropriate template
    const template = getTemplate(questionTitle);
    if (!template) {
      throw new Error(`Template not found for question: ${questionTitle}`);
    }
    
    // Insert user's code into the template
    const processedCode = template.replace(
      /\/\/ User's solution function will be inserted here[\s\S]*?return.*;/,
      code.trim()
    );

    const response = await fetch('/api/code/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: processedCode,
        language,
        stdin,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Submission failed: ${errorData.message || response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Code submission error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process code submission');
  }
};
