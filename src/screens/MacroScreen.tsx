import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

/** STEP 1 placeholder — routine & macro automation UI built in STEP 2. */
export function MacroScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Macro Studio</Text>
        <Text style={styles.caption}>Record & trigger multi-step routines</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.navy.base },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { color: theme.palette.text.high, fontSize: 24, fontWeight: '700' },
  caption: { marginTop: 8, color: theme.palette.text.mid, fontSize: 13 },
});