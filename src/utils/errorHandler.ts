import { Alert } from 'react-native';

export class AppError extends Error {
    constructor(
        message: string,
        public userMessage: string,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const ErrorMessages = {
    NETWORK: 'No internet connection. Please check your network and try again.',
    API_KEY_INVALID: 'Invalid API key. Please check your settings and ensure you have entered a valid key.',
    API_KEY_MISSING: 'API key not configured. Please add your API keys in Settings.',
    IMAGE_LOAD_FAILED: 'Failed to load image. Please try again.',
    IMAGE_SAVE_FAILED: 'Failed to save image. Please check storage space.',
    STORAGE_FULL: 'Storage is full. Please free up some space and try again.',
    STORAGE_ERROR: 'Failed to save data. Please try again.',
    EVALUATION_FAILED: 'Failed to evaluate paper. Please check your API keys and try again.',
    EXTRACTION_FAILED: 'Failed to extract questions. Please ensure the image is clear and try again.',
    UNKNOWN: 'Something went wrong. Please try again.',
};

export const showError = (error: any, fallbackMessage?: string) => {
    let userMessage = fallbackMessage || ErrorMessages.UNKNOWN;

    // Check if it's our custom AppError
    if (error instanceof AppError) {
        userMessage = error.userMessage;
    }
    // Network errors
    else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        userMessage = ErrorMessages.NETWORK;
    }
    // API key errors
    else if (error.message?.includes('API Key') || error.message?.includes('API key')) {
        if (error.message.includes('not found') || error.message.includes('not configured')) {
            userMessage = ErrorMessages.API_KEY_MISSING;
        } else {
            userMessage = ErrorMessages.API_KEY_INVALID;
        }
    }
    // Image errors
    else if (error.message?.includes('image') || error.message?.includes('Image')) {
        userMessage = ErrorMessages.IMAGE_LOAD_FAILED;
    }
    // Storage errors
    else if (error.message?.includes('storage') || error.message?.includes('Storage')) {
        userMessage = ErrorMessages.STORAGE_ERROR;
    }

    // Log for debugging
    console.error('[AppError]', {
        message: error.message,
        userMessage,
        stack: error.stack,
    });

    // Show user-friendly alert
    Alert.alert('Error', userMessage, [{ text: 'OK' }]);
};

export const showSuccess = (message: string) => {
    Alert.alert('Success', message, [{ text: 'OK' }]);
};

export const showWarning = (message: string) => {
    Alert.alert('Warning', message, [{ text: 'OK' }]);
};

export const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
) => {
    Alert.alert(title, message, [
        {
            text: 'Cancel',
            style: 'cancel',
            onPress: onCancel,
        },
        {
            text: 'Confirm',
            onPress: onConfirm,
        },
    ]);
};
