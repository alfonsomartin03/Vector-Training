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
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  primary: {
    backgroundColor: theme.colors.text,
  },

  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
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