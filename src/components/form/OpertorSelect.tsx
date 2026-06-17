import {Autocomplete, createFilterOptions, FilterOptionsState, FormControl, TextField} from "@mui/material";
import React from "react";
import {Control, Controller} from "react-hook-form";

export const OperatorSelect = <TOptions extends {id: string},>(params: {
  options: TOptions[],
  control: Control<any, any>,
  name: string,
  label: string,
  onSelect: (item: any) => void
}) => {
  const {options, name, control, label} = params;

  const OPTIONS_LIMIT = 5;
  const defaultFilterOptions = createFilterOptions<TOptions>();

  const filterOptions = (options:TOptions[], state: FilterOptionsState<TOptions>) => {
    return defaultFilterOptions(options, state).slice(0, OPTIONS_LIMIT);
  };

  return (
    <FormControl>
      <Controller
        control={control}
        name={name}
        rules={{required: true}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <Autocomplete
            onChange={(event, item) => {
              if (item) {
                params.onSelect(item)
              }
              onChange(typeof item === "string" ? item : item !== null ? (item as TOptions).id : null);
            }}
            filterOptions={filterOptions}
            freeSolo
            value={value}
            options={options}
            getOptionLabel={(option) => typeof option === "string" ? option : option.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                // margin="normal"
                variant="outlined"
                error={!!error}
                helperText={error && "item required"}
              />
            )}
          />
        )}
      />
    </FormControl>
  )
}