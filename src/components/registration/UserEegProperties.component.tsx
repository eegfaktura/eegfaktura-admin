import React, {FC} from "react";
import {useFormContext} from "react-hook-form";
import FormInputComponent from "../form/FormInput.component";
import {Box} from "@mui/material";
import {IbanInputForm} from "../form/IbanInput.component";
import AccountsEegPropertiesComponent from "./AccountsEegProperties.component";

const UserEegPropertiesComponent: FC = () => {

  const {control} = useFormContext()

  return (
    <Box className={"flex-col-mgap"} style={{padding: "16px"}} bgcolor={"background.paper"}>
      <h2>EEG Betreiber</h2>
      <FormInputComponent name={"user.firstname"} label="Vorname" control={control} type="text" rules={{required: "Vorname fehlt"}}/>
      <FormInputComponent name={"user.lastname"} label="Nachname" control={control} type="text" rules={{required: "Nachname fehlt"}}/>
      <FormInputComponent name={"contact.street"} label="Straße" control={control} rules={{required: false}} type="text" />
      <FormInputComponent name={"contact.streetNumber"} label="Hausnummer" control={control} rules={{required: false}} type="text" />
      <FormInputComponent name={"contact.city"} label="Ort" control={control} rules={{required: false}} type="text" />
      <FormInputComponent name={"contact.zip"} label="Postleitzahl" control={control} rules={{required: false}} type="text"/>
      <FormInputComponent name={"contact.phone"} label="Telefonnummer" control={control} type="text"/>
      <FormInputComponent name={"user.email"} label="E-Mail" control={control} type="text" rules={{required: "E-Mail fehlt"}}/>

      <h4>Konto</h4>
      <IbanInputForm name={"accountInfo.iban"} label="IBAN" control={control} type="text" rules={{required: "IBAN"}}/>
      <FormInputComponent name={"accountInfo.owner"} label="Konto Inhaber" control={control} type="text" rules={{required: "Konto Inhaber"}}/>

      <AccountsEegPropertiesComponent/>
    </Box>
  )
}

export default UserEegPropertiesComponent