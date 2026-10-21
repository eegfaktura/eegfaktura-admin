import React, {FC} from "react";
import {useFieldArray, useFormContext} from "react-hook-form";
import {Box, Button, IconButton, Typography} from "@mui/material";
import {DeleteOutline} from "@mui/icons-material";
import FormInputComponent from "../form/FormInput.component";
import {EegRegister} from "../../model/eeg.model";

export const EMAIL_RULE = {value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "E-Mail ungültig"}

// Logins of the new community (platform#166): exactly these accounts are set up, all with the same rights. An
// e-mail that already has an account only gets the community added. Empty: a login for the operator above.
const AccountsEegPropertiesComponent: FC = () => {
  const {control} = useFormContext<EegRegister>()
  const {fields, append, remove} = useFieldArray({control, name: "accounts"})

  return (
    <Box className={"flex-col-mgap"}>
      <h4>Logins</h4>
      <Typography fontSize={"0.85em"}>
        {fields.length === 0
          ? "Ohne Eintrag bekommt der EEG Betreiber den Login."
          : "Diese Personen bekommen einen Login mit denselben Rechten und eine Mail, um ihr Passwort zu setzen. " +
            "Hat eine E-Mail-Adresse schon einen Account, wird die EEG dort ergänzt."}
      </Typography>
      {fields.map((f, i) => (
        <Box key={f.id} sx={{display: "flex", flexDirection: "row", gap: "8px", alignItems: "flex-start"}}>
          <FormInputComponent name={`accounts.${i}.firstname`} label="Vorname" control={control} type="text"
                              rules={{required: "Vorname fehlt"}}/>
          <FormInputComponent name={`accounts.${i}.lastname`} label="Nachname" control={control} type="text"
                              rules={{required: "Nachname fehlt"}}/>
          <FormInputComponent name={`accounts.${i}.email`} label="E-Mail" control={control} type="text"
                              rules={{required: "E-Mail fehlt", pattern: EMAIL_RULE}}/>
          <IconButton aria-label="Login entfernen" title="Login entfernen" onClick={() => remove(i)}>
            <DeleteOutline/>
          </IconButton>
        </Box>
      ))}
      <Box>
        <Button variant="outlined" size="small" onClick={() => append({firstname: "", lastname: "", email: ""})}>
          Login hinzufügen
        </Button>
      </Box>
    </Box>
  )
}

export default AccountsEegPropertiesComponent
