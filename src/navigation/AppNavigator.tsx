import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SetupAssessmentScreen from '../screens/SetupAssessmentScreen';
import ReviewQuestionsScreen from '../screens/ReviewQuestionsScreen';
import EvaluationScreen from '../screens/EvaluationScreen';
import EvaluationResultScreen from '../screens/EvaluationResultScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SubjectDetailsScreen from '../screens/SubjectDetailsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import LicenseActivationScreen from '../screens/LicenseActivationScreen';
import ExamSessionsScreen from '../screens/ExamSessionsScreen';
import YearBrowserScreen from '../screens/YearBrowserScreen';
import ClassBrowserScreen from '../screens/ClassBrowserScreen';
import ExamTypeBrowserScreen from '../screens/ExamTypeBrowserScreen';
import StudentBrowserScreen from '../screens/StudentBrowserScreen';

const Stack = createStackNavigator();

export default function AppStack() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#0f172a' }
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="SetupAssessment" component={SetupAssessmentScreen} />
                <Stack.Screen name="ReviewQuestions" component={ReviewQuestionsScreen} />
                <Stack.Screen name="Evaluation" component={EvaluationScreen} />
                <Stack.Screen name="EvaluationResult" component={EvaluationResultScreen} />
                <Stack.Screen name="ExamSessions" component={ExamSessionsScreen} />
                <Stack.Screen name="SubjectDetails" component={SubjectDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="YearBrowser" component={YearBrowserScreen} />
                <Stack.Screen name="ClassBrowser" component={ClassBrowserScreen} />
                <Stack.Screen name="ExamTypeBrowser" component={ExamTypeBrowserScreen} />
                <Stack.Screen name="StudentBrowser" component={StudentBrowserScreen} />
                <Stack.Screen name="LicenseActivation" component={LicenseActivationScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
