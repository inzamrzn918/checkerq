import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme/theme';
import { Check, X } from 'lucide-react-native';

interface MarkOverlayProps {
    results: any[];
    questions: any[];
    height: number;
    width: number;
}

export const MarkOverlay = ({ results, questions, height, width }: MarkOverlayProps) => {
    // We space marks evenly along the left side
    const margin = 20;
    const spacing = 40;

    // Filter results that have marks (skip if not evaluated yet)
    const markedResults = results.filter(r => r.obtainedMarks !== undefined);

    return (
        <View style={[styles.overlay, { height, width }]} pointerEvents="none">
            {markedResults.map((res, index) => {
                const question = questions.find(q => q.id === res.questionId);
                const maxMarks = question?.marks || 0;
                const isFullMarks = res.obtainedMarks === maxMarks;
                const isZero = res.obtainedMarks === 0;

                return (
                    <View
                        key={index}
                        style={[
                            styles.markBox,
                            // Use specific coordinates if available, otherwise classic list
                            (res.answerRegions && res.answerRegions.length > 0) ? {
                                top: (res.answerRegions[0].boundingBox[0] / 1000) * height,
                                // Move to LEFT of the answer box. 
                                // xmin is the left edge of answer. We subtract a margin to put it in the "margin space".
                                left: Math.max(0, ((res.answerRegions[0].boundingBox[1] / 1000) * width) - 50)
                            } : {
                                top: margin + (index * 60),
                                left: 10
                            }
                        ]}
                    >
                        <View style={styles.iconBox}>
                            {isZero ? (
                                <X size={40} color="red" strokeWidth={3} />
                            ) : (
                                <Check size={40} color="red" strokeWidth={3} />
                            )}
                        </View>
                        <Text style={styles.markText}>{res.obtainedMarks}</Text>
                        <View style={styles.circle} />
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'transparent',
    },
    markBox: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBox: {
        width: 24,
        alignItems: 'center',
    },
    markText: {
        color: 'red',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'serif', // Look more like handwriting
    },
    circle: {
        position: 'absolute',
        top: -5,
        left: 15,
        width: 35,
        height: 35,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'red',
        transform: [{ rotate: '-10deg' }],
        opacity: 0.6
    }
});
