import React, {FC} from "react";
import {useFormContext, useWatch} from "react-hook-form";
import {Box} from "@mui/material";
import FormInputComponent from "../form/FormInput.component";
import FormCheckboxComponent from "../form/FormCheckbox.component";
import FormSelectComponent from "../form/FormSelect.component";
import {OperatorSelect} from "../form/OpertorSelect";
import {useSelector} from "react-redux";
import {selectGridOperators} from "../../redux/features/eegStateSlice";

const PontonPropertiesComponent: FC = () => {
  const {control, watch, setValue, resetField} = useFormContext()

  const online = watch ? watch("online") : false
  const [commType] = useWatch({control: control, name: ['pontonInfo.pontonCommType']})

  const operators = useSelector(selectGridOperators)

  return (
    <form>
    <Box className={"flex-col-mgap"} style={{padding: "16px"}} bgcolor={"background.paper"}>
      <h4>Netzbetreiber</h4>
      <OperatorSelect options={operators} control={control} name={"grid.id"} label="Netzbetreiber-ID"
                      onSelect={(item) => item ? setValue("grid.name", item.name, {shouldValidate: true}) : resetField("grid.name")}/>
      <FormInputComponent name={"grid.name"} label="Netzbetreiber-Name" control={control}
                          rules={{required: "Netzbetreiber-Name fehlt"}} type="text"/>

      <h4>Keycloak User</h4>
      <FormInputComponent name={"user.username"} label="User Name" control={control} type="text"/>
      <FormInputComponent name={"user.password"} label="Passwort" control={control} type="password"/>
      <FormInputComponent name={"user.confirmPassword"} label="Passwort bestätigen" control={control} type="password" rules={{validate: (value:string) => (watch ? value === watch("user.password") : false) || "Passwords do not match"}}/>

      <h4>Ponton Verbindung</h4>
      <FormCheckboxComponent name={"online"} label="EEG ist online" control={control}/>
      <FormSelectComponent control={control} label={"Ponton Kommunikation"} name={"pontonInfo.pontonCommType"}
                           options={[
                             {key: "NONE", value: "ignorieren / bereits konfiguriert"},
                             {key: "KEP", value: "Kep Server"},
                             {key: "MAIL", value: "E-Mail"},
                           ]} disabled={!online}></FormSelectComponent>
      {commType === 'MAIL' &&
          <>
              <FormInputComponent name={"pontonInfo.host"} label="Ponton SMTP Hostname" control={control} type="text"
                                  disabled={!online}/>
              <FormInputComponent name={"pontonInfo.port"} label="Ponton SMTP Portnummer" control={control} type="text"
                                  disabled={!online}/>
              <FormInputComponent name={"pontonInfo.username"} label="Ponton SMTP Username" control={control}
                                  type="text" disabled={!online}/>
              <FormInputComponent name={"pontonInfo.password"} label="Passwort" control={control} type="password"
                                  disabled={!online}/>
              <FormInputComponent name={"pontonInfo.confirmPassword"} label="Passwort bestätigen" control={control}
                                  type="password"
                                  rules={online ? {validate: (value: string) => (watch ? value === watch("pontonInfo.password") : false) || "Ponton Passwords do not match"} : undefined}
                                  disabled={!online}/>
          </>
      }
    </Box>
    </form>
  )
}

export default PontonPropertiesComponent;