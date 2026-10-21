import React, {FC} from "react";
import {useFormContext} from "react-hook-form";
import FormInputComponent from "../form/FormInput.component";
import {Box} from "@mui/material";

// const AddressEegPropertiesComponent: FC<AddressEegPropertiesComponentProps> = ({control}) => {
const AddressEegPropertiesComponent: FC = () => {
  const {control} = useFormContext();
  return (
    <Box className={"flex-col-mgap"} style={{padding: "16px"}} bgcolor={"background.paper"}>
      <h2>Kontakt Einstellungen Erneuerbarer Energie Gemeinschaften</h2>
      <FormInputComponent name={"contact.owner"} label="Kontaktperson" control={control} rules={{required: {value: true, message: "Kontaktperson fehlt"}}} type="text" />
      <FormInputComponent name={"contact.street"} label="Straße" control={control} rules={{required: "Straße fehlt"}} type="text" />
      <FormInputComponent name={"contact.streetNumber"} label="Hausnummer" control={control} rules={{required: "Hausnummer fehlt"}} type="text" />
      <FormInputComponent name={"contact.city"} label="Ort" control={control} rules={{required: "Ort fehlt"}} type="text" />
      <FormInputComponent name={"contact.zip"} label="Postleitzahl" control={control} rules={{required: "Postleitzahl fehlt"}} type="text"/>
      <FormInputComponent name={"contact.phone"} label="Telefonnummer" control={control} type="text"/>
      <FormInputComponent name={"contact.email"} label="email" control={control} type="text"/>
      <FormInputComponent name={"contact.website"} label="Webseite" control={control} type="text"/>
    </Box>
  )
}

export default AddressEegPropertiesComponent