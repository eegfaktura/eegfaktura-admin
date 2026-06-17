import {Control, Controller, Path} from "react-hook-form";
import {MaskitoOptions} from "@maskito/core";
import {useMaskito} from "@maskito/react";
import {FormControl, FormHelperText, InputLabel, OutlinedInput} from "@mui/material";
import React from "react";

interface FormIbanComponentProps<T extends object> {
  control: Control<T, any>;
  rules?: object,
  label: string;
  name: Path<T>;
  placeholder?: string;
  type?: string;
  size?: 'small' | 'medium' | undefined;
  disabled?: boolean
}

export function IbanInputForm<T extends object>(props : FormIbanComponentProps<T>) {
  const {control, rules, label, name, placeholder, type, disabled, ...rest} = props;
  const digitsOnlyMask: MaskitoOptions = {
    mask:  [
      ...Array(2).fill(/[A-Z]/),
      ...Array(2).fill(/\d/),
      ' ',
      ...Array(4).fill(/[A-Z0-9]/),
      ' ',
      ...Array(4).fill(/\d/),
      ' ',
      ...Array(4).fill(/\d/),
      ' ',
      ...Array(4).fill(/\d/),
      ' ',
      ...Array(4).fill(/\d/),
      ' ',
      ...Array(4).fill(/\d/),
      // ],
      // preprocessors: [
      //   ({elementState, data}, actionType) => {
      //     const {value, selection} = elementState;
      //
      //     return {
      //       elementState: {
      //         selection,
      //         value,
      //       },
      //       data
      //     };
      //   },
    ]
  }

  const ibanMask = useMaskito({
    options: digitsOnlyMask,
  });

  return (

    <FormControl>
      <InputLabel htmlFor={"component-outlined-" + name}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        rules={disabled ? undefined : rules}
        render={({
                   field: {onChange, value},
                   fieldState: {error},
                   formState,
                 }) => (
          <>
            <OutlinedInput
              id={"component-outlined-" + name}
              error={!!error}
              onChange={onChange}
              value={value}
              fullWidth
              label={label}
              disabled={disabled}
              ref={ibanMask}
              {...rest}
            />
            {!!error && (
              <FormHelperText error id="accountId-error">
                {error.message}
              </FormHelperText>
            )}
          </>
        )}
      />
      {/*{!error && <div className={"error-line"}>{error.message}</div>}*/}
    </FormControl>
    )
}