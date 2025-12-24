import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface BarChartProps {
    data: {
        labels: string[];
        datasets: { data: number[] }[];
    };
    title?: string;
    yAxisSuffix?: string;
}

export default function BarChart({ data, title, yAxisSuffix = '' }: BarChartProps) {
    return (
        <View style={styles.container}>
            {title && <Text style={styles.title}>{title}</Text>}
            <RNBarChart
                data={data}
                width={width - 40}
                height={220}
                yAxisSuffix={yAxisSuffix}
                chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: (opacity = 1) => theme.colors.text,
                    style: {
                        borderRadius: 16,
                    },
                    propsForLabels: {
                        fontSize: 12,
                    },
                }}
                style={styles.chart}
                showValuesOnTopOfBars
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    chart: {
        borderRadius: 16,
    },
});
