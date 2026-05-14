import VrtxAndroid from 'vrtx-react-native';
import { Button, StyleSheet, Text, View, Alert } from 'react-native';

// Read from Expo environment variables (EXPO_PUBLIC_*)
const VRTX_CLIENT_ID = process.env.EXPO_PUBLIC_VRTX_CLIENT_ID;
const VRTX_CLIENT_SECRET = process.env.EXPO_PUBLIC_VRTX_CLIENT_SECRET;
const VRTX_ENVIRONMENT = process.env.EXPO_PUBLIC_VRTX_ENVIRONMENT || 'SANDBOX';

export default function App() {
  const handleSetup = async () => {
    if (!VRTX_CLIENT_ID || !VRTX_CLIENT_SECRET) {
      Alert.alert(
        'Configuration Required',
        'Please set EXPO_PUBLIC_VRTX_CLIENT_ID and EXPO_PUBLIC_VRTX_CLIENT_SECRET in .env file'
      );
      return;
    }

    try {
      await VrtxAndroid.setup(
        VRTX_CLIENT_ID,
        VRTX_CLIENT_SECRET,
        VRTX_ENVIRONMENT as 'SANDBOX' | 'STAGING',
        'ENGLISH' as any,
        'LIGHT' as any
      );
      Alert.alert('Success', 'Vrtx SDK launched!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vrtx React Native</Text>
        <Text style={styles.subtitle}>Fintech SDK Integration</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Initialize SDK</Text>
          <Text style={styles.description}>
            Tap the button below to launch the Vrtx SDK UI flow.
          </Text>
          <Button
            title="Launch Vrtx SDK"
            onPress={handleSetup}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Current Configuration</Text>
          <Text>Environment: {VRTX_ENVIRONMENT}</Text>
          <Text>Client ID: {VRTX_CLIENT_ID ? '✓ Set' : '✗ Missing'}</Text>
          <Text>Client Secret: {VRTX_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0E5C56',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#132724',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  info: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#132724',
  },
});
