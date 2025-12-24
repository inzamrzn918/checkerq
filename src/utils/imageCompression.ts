import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

export const compressImage = async (
    uri: string,
    options: CompressionOptions = {}
): Promise<string> => {
    try {
        const {
            maxWidth = 1200,
            maxHeight = 1600,
            quality = 0.7,
        } = options;

        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth, height: maxHeight } }],
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );

        return result.uri;
    } catch (error) {
        console.error('Image compression error:', error);
        return uri; // Return original if compression fails
    }
};

export const compressMultipleImages = async (
    uris: string[],
    options: CompressionOptions = {}
): Promise<string[]> => {
    try {
        const compressed = await Promise.all(
            uris.map(uri => compressImage(uri, options))
        );
        return compressed;
    } catch (error) {
        console.error('Multiple image compression error:', error);
        return uris;
    }
};
