import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';

export default function HOme() {
  const [publicKey, setPublicKey] = useState('');
  const [isBiometrics, setIsBiometrics] = useState(false);
  useEffect(() => {
    bio();
  }, []);
  const bio = async () => {
    const publicKey = await AsyncStorage.getItem('@public_key');
    setPublicKey(publicKey);
    const rnBiometrics = new ReactNativeBiometrics();
    const {biometryType} = await rnBiometrics.isSensorAvailable();

    if (biometryType === BiometryTypes.Biometrics) {
      setIsBiometrics(true);
    } else {
      setIsBiometrics(false);
    }
  };

  const generatePublicKey = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const {keysExist} = await rnBiometrics.biometricKeysExist();
      if (!keysExist) {
        const {publicKey} = await rnBiometrics.createKeys();
        if (publicKey) {
          setPublicKey(publicKey);
          await AsyncStorage.setItem('@public_key', publicKey);
          console.log('create new public key: ', publicKey);
        }
      }
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const removePublicKey = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const publicKey = await rnBiometrics.deleteKeys();
      Alert.alert('Remove', 'Public key remove successfully');
      setPublicKey('');
      console.log('Key remove success');
      await AsyncStorage.removeItem('@public_key');
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const simplePrompt = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    const {success} = await rnBiometrics.simplePrompt({
      promptMessage: 'Confirm fingerprint',
    });
    console.log('simple: ', success);
    // Alert.alert('Remove', 'Public key remove successfully');
  };

  const verifyBio = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    let epochTimeSeconds = Math.round(new Date().getTime() / 1000).toString();
    let payload = epochTimeSeconds + 'for test';
    try {
      const createSignature = await rnBiometrics.createSignature({
        promptMessage: 'Sign in',
        payload: payload,
      });
      const {success, signature} = createSignature;
      if (success) {
        Alert.alert('Success', 'Verification success');
        console.log('signature: ', signature);
        console.log('payload: ', payload);
      }
    } catch (error) {
      if (error?.toString().includes('Error generating signature:')) {
        Alert.alert('Error', 'Please generate public key first');
      } else {
        Alert.alert('Error', error?.toString().replace('Error: ', ''));
      }
      console.log('error: ', error);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello world</Text>
      {isBiometrics ? (
        <>
          <Text style={styles.para}>Public key exist: {publicKey}</Text>
          <View style={styles.buttonContainer}>
            <Button
              color={'green'}
              title="Generate public key"
              onPress={generatePublicKey}
              disabled={!!publicKey}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Verify biometric" onPress={verifyBio} />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Remove public key"
              color={'red'}
              onPress={removePublicKey}
              disabled={!publicKey}
            />
          </View>
        </>
      ) : (
        <Text style={styles.notAvailable}>Biometrics not found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 32,
  },
  para: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  notAvailable: {
    textAlign: 'center',
  },
});
