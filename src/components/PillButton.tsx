import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
  AccessibilityRole,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface PillButtonProps {
  label: string;
  icon: IoniconName;
  onPress?: () => void;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
}

/**
 * PillButton — quick-action capsule used on the Dashboard quick-action rail
 * ('Music', 'Study', 'Journal') and system toggles. Active state gets the
 * neon fill.
 */
export function PillButton({
  label,
  icon,
  onPress,
  active = false,
  style,
  accessibilityRole = 'button',
}: PillButtonProps) {
  const { palette } = theme;
  const tint = active ? '#0B101E' : palette.text.high;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      style={({ pressed }) => [
        base.pill,
        {
          backgroundColor: active
            ? palette.neon.primary
            : 'rgba(74,144,226,0.14)',
          borderColor: active
            ? palette.neon.primary
            : palette.neon.faint,
        },
        pressed && { transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={[base.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const base = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});