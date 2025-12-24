import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
    light: async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Haptics not supported on this device
        }
    },

    medium: async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            // Haptics not supported
        }
    },

    heavy: async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
            // Haptics not supported
        }
    },

    success: async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            // Haptics not supported
        }
    },

    warning: async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
            // Haptics not supported
        }
    },

    error: async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
            // Haptics not supported
        }
    },

    selection: async () => {
        try {
            await Haptics.selectionAsync();
        } catch (error) {
            // Haptics not supported
        }
    },
};
