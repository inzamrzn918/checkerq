import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface PieChartProps {
    data: {
        name: string;
        population: number;
        color: string;
        legendFontColor: string;
        legendFontSize: number;
    }[];
    title?: string;
}

export default function PieChart({ data, title }: PieChartProps) {
    return (
        <View style={styles.container}>
            {title && <Text style={styles.title}>{title}</Text>}
            <RNPieChart
                data={data}
                width={width - 40}
                height={220}
                chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
});
