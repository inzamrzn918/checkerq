import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import ViewShot from "react-native-view-shot";
import { MarkOverlay } from './MarkOverlay';

interface PageMarkerProps {
    uri: string;
    results: any[];
    questions: any[];
    onCapture: (newUri: string) => void;
}

export const PageMarker = ({ uri, results, questions, onCapture }: PageMarkerProps) => {
    const viewShotRef = useRef<any>(null);

    useEffect(() => {
        // Wait for image to load/render, then capture
        const timer = setTimeout(() => {
            capture();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const capture = async () => {
        if (viewShotRef.current) {
            try {
                const uri = await viewShotRef.current.capture();
                onCapture(uri);
            } catch (err) {
                console.error("Failed to capture marked page:", err);
                onCapture(uri); // Fallback to original
            }
        }
    };

    return (
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.8 }} style={styles.container}>
            <Image source={{ uri }} style={styles.image} resizeMode="stretch" />
            <MarkOverlay
                results={results}
                questions={questions}
                height={1000} // Standardized height for capture
                width={700}   // Standardized width for capture
            />
        </ViewShot>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 700,
        height: 1000,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: '100%',
    }
});
