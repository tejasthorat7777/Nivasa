import * as React from "react";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { HelperText, TextInput } from "react-native-paper";
import { COLORS } from "../../theme";

export interface CustomInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "number";
  error?: boolean;
  helperText?: string;
  rules?:
    | Pick<RegisterOptions<T, Path<T>>, "required">
    | Pick<RegisterOptions<T, Path<T>>, "required">[];
}

export function CustomInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  error,
  helperText,
  rules,
}: CustomInputProps<T>) {
  const controllerRules = Array.isArray(rules)
    ? { required: rules.some((rule) => rule.required) }
    : rules;

  return (
    <Controller
      control={control}
      name={name}
      rules={controllerRules}
      render={({ field: { onBlur, onChange, value }, fieldState }) => {
        const hasError = Boolean(error || fieldState.error);

        return (
          <>
            <TextInput
              mode="outlined"
              label={label}
              placeholder={placeholder}
              activeOutlineColor={COLORS.primary}
              outlineColor={COLORS.border}
              outlineStyle={{ borderRadius: 8 }}
              style={{ backgroundColor: COLORS.surface }}
              value={value == null ? "" : String(value)}
              onChangeText={(text) =>
                onChange(type === "number" && text !== "" ? Number(text) : text)
              }
              onBlur={onBlur}
              secureTextEntry={type === "password"}
              keyboardType={
                type === "email"
                  ? "email-address"
                  : type === "number"
                    ? "numeric"
                    : "default"
              }
              autoCapitalize={type === "email" ? "none" : "sentences"}
              error={hasError}
            />
            <HelperText type="error" visible={hasError}>
              {helperText ?? fieldState.error?.message}
            </HelperText>
          </>
        );
      }}
    />
  );
}
