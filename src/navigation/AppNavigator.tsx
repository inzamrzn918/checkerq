import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import SetupAssessmentScreen from '../screens/SetupAssessmentScreen';
import ReviewQuestionsScreen from '../screens/ReviewQuestionsScreen';
import EvaluationScreen from '../screens/EvaluationScreen';
import EvaluationResultScreen from '../screens/EvaluationResultScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SubjectDetailsScreen from '../screens/SubjectDetailsScreen';

const Stack = createStackNavigator();

export default function AppStack() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#0f172a' }
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="SetupAssessment" component={SetupAssessmentScreen} />
                <Stack.Screen name="ReviewQuestions" component={ReviewQuestionsScreen} />
                <Stack.Screen name="Evaluation" component={EvaluationScreen} />
                <Stack.Screen name="EvaluationResult" component={EvaluationResultScreen} />
                <Stack.Screen name="SubjectDetails" component={SubjectDetailsScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
