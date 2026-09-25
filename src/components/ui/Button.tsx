import {
    Pressable,
    PressableProps,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";

import { theme } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  style?: ViewStyle;
};

export default function Button({
  title,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed ? styles.pressed : undefined,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "primary"
            ? styles.primaryText
            : styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  primary: {
    backgroundColor: theme.colors.darkSurface,
    boxShadow: theme.shadows.soft,
  },

  secondary: {
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },

  pressed: {
    opacity: 0.78,
  },

  text: {
    fontSize: 15,
    fontWeight: "600",
  },

  primaryText: {
    color: theme.colors.white,
  },

  secondaryText: {
    color: theme.colors.text,
  },
});
