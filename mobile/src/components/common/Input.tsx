import * as React from "react";
import { Input as RNInput, InputProps } from "react-native-paper";

export interface CustomInputProps extends InputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "password" | "email";
  error?: string;
  rules?: { required?: boolean; value?: (val: string) => boolean }[];
}

export const CustomInput = React.forwardRef<
  HTMLInputElement,
  CustomInputProps
>(({ label, placeholder, type = "text", error, rules, ...props }, ref) => {
  const [errorState, setErrorState] = React.useState<string | null>(error || null);

  return (
    <RNInput
      ref={ref}
      label={label}
      placeholder={placeholder}
      type={type}
      error={!!error}
      onErrorPress={async () => setErrorState(error)}
      {...props}
    />
  );
});