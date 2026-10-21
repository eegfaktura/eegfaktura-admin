import React, {FC, useContext, useEffect} from "react";
import {useFormContext, useWatch} from "react-hook-form";
import FormInputComponent from "../form/FormInput.component";
import FormSelectComponent from "../form/FormSelect.component";
import {
  Box,
} from "@mui/material";

import "../component.scss"
import ExcelUploader from "../common/ExcelUploader";
import {RegistrationContext} from "../../hooks/RegistrationContext";

const CommonEegPropertiesComponent: FC = () => {

  const {excelFile, onLoad} = useContext(RegistrationContext)

  const {control, setValue} = useFormContext()

  const rcNr = useWatch({control: control, name: "rcNumber"})
  useEffect(() => {
    setValue("tenant", rcNr)
  }, [rcNr, setValue]);

  return (
    <Box className={"flex-col-mgap"} style={{padding: "16px"}} bgcolor={"background.paper"}>
      {/*<CorePageTemplate>*/}
      <Box sx={{display: "flex", justifyContent: "space-between", flexDirection: "row", alignItems: "center"}}>
        <h2>Allgemeine Einstellungen Erneuerbarer Energie Gemeinschaften</h2>
        <ExcelUploader fileName={excelFile} onLoad={(f: string,  d: Record<string, any>[]) => {
          onLoad(f, d)
        }}/>
      </Box>
      <FormInputComponent name={"name"} label="Kurzname" control={control} rules={{required: "Name fehlt"}} type="text"
                          placeholder="Kurzname deiner EEG"/>
      <FormInputComponent name={"description"} label="EEG Beschreibung" control={control}
                          rules={{required: "Name fehlt"}} type="text" placeholder="Kurzbeschreibung deiner EEG"/>
      <FormInputComponent name={"rcNumber"} label="RC-Nummer" control={control} rules={{
        required: "RC-Nummer fehlt",
        pattern: {value: /^[A-Za-z0-9]*$/, message: "Tenant darf nur Zeichen und Ziffern enthalten"}
      }} type="text"/>
      <FormInputComponent name={"tenant"} label="Tenant" control={control} rules={{
        required: "Tenant fehlt",
        pattern: {value: /^[A-Za-z0-9-_]*$/, message: "Tenant darf nur Zeichen, Ziffern sowie _ oder - enthalten"}
      }} type="text"/>
      <FormInputComponent name={"communityId"} label="Gemeinschafts-ID" control={control}
                          rules={{required: "Gemeinschafts-ID fehlt"}} type="text"/>

      <FormSelectComponent label={"Abrechnungszeitraum"} placeholder={"Abrechnungszeitraum"} control={control}
                           name={"businessInfo.settlementInterval"} options={[
        {key: "MONTHLY", value: "Monatlich"},
        {key: "QUARTER", value: "Vierteljährlich"},
        {key: "BIANNUAL", value: "Halbjährlich"},
        {key: "ANNUAL", value: "Jährlich"},
      ]}/>

      <FormSelectComponent name={"businessInfo.legal"} label="Rechtsform" control={control} options={[
        {key: "verein", value: "Verein"},
        {key: "genossenschaft", value: "Genossenschaft"},
        {key: "gesellschaft", value: "Gesellschaft"}]}/>
      <FormSelectComponent name={"grid.allocation"} label="Verteilung" control={control} options={[
        {key: "STATIC", value: "Statisch"},
        {key: "DYNAMIC", value: "Dynamisch"}]} placeholder="Verteilung"/>
      <FormSelectComponent name={"grid.area"} label="Region" control={control} options={[
        {key: "LOCAL", value: "Local"},
        {key: "REGIONAL", value: "Regional"},
        {key: "GEA", value: "Gemeinschaftliche Erzeugungsanlagen"},
        {key: "BEG", value: "Bürgergemeinschaften"}]} placeholder="Region"/>
    </Box>

  )
}

export default CommonEegPropertiesComponent;