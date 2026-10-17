import React, {FC, useEffect} from "react";
import {useForm, useWatch} from "react-hook-form";
import {PontonRegister} from "../../model/eeg.model";
import {Alert, Box, Button} from "@mui/material";
import Snackbar, {SnackbarCloseReason} from "@mui/material/Snackbar";
import FormInputComponent from "../../components/form/FormInput.component";
import {Api, APIError} from "../../services/eeg.service";
import FormSelectComponent from "../../components/form/FormSelect.component";

const RegistrationPontonPage: FC = () => {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<{message: string, severity: "success" | "error" | "warning" | "info" | undefined}>({message: "", severity: "success"});

  const pontonReg: PontonRegister = {
    tenant: "", rcNumber: "", pontonInfo: {password: "", domain: "edanet.at", username: "", pontonCommType: "KEP"},
  } as PontonRegister

  const {handleSubmit, control, setValue, watch, formState: {errors}, reset} = useForm<PontonRegister>({defaultValues: pontonReg})

  const [commType, rcNumber] = useWatch({control: control, name: ['pontonInfo.pontonCommType', 'rcNumber']})

  useEffect(() => {
    setValue("tenant", rcNumber)
  }, [rcNumber]);


  const onSubmit = (data: PontonRegister) => {
    try {
      setPending(true)
      Api.eegService.registerPonton(data)
        .then(r => {
          setMessage({message: "Ponton-Registrierung abgeschlossen.", severity: "success"})
          setOpen(true)
          reset()
        })
        .catch((e: APIError) => {
          console.error(e)
          setMessage({message: e.message || "Ponton-Registrierung fehlgeschlagen", severity: "error"})
          setOpen(true)
        })
        .finally(() => setPending(false))
    } catch (e) {
      console.error(e)
    }
  };

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <Box className={"flex-col-mgap"} style={{padding: "16px"}}>
      <Snackbar autoHideDuration={10000} open={open} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={message.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message.message}
        </Alert>
      </Snackbar>

      <h2>Ponton Verbindung</h2>

      <FormInputComponent name={"rcNumber"} label="EEG RC-Nummer" control={control} type="text"
                          placeholder={"z.b. GC100100"} rules={{required: "RC-Nummer erforderlich"}}/>

      <FormInputComponent name={"tenant"} label="EEG Tenant" control={control} type="text"
                          placeholder={"z.b. GC100100-001"} rules={{required: "Tenant erforderlich"}}/>

      <FormSelectComponent control={control} label={"Ponton Kommunikation"} name={"pontonInfo.pontonCommType"} options={[
        {key: "KEP", value: "Kep Server"},
        {key: "MAIL", value: "E-Mail"},
      ]}></FormSelectComponent>
      {commType === 'MAIL' &&
          <>
              <FormInputComponent name={"pontonInfo.domain"} label="Ponton SMTP Domain Name" control={control} type="text"
                                  rules={{required: "Email Domainname fehlt!"}}/>
              <FormInputComponent name={"pontonInfo.username"} label="Ponton SMTP Username" control={control} type="text"
                                  rules={{required: "Email Benutzername fehlt!"}}/>
              <FormInputComponent name={"pontonInfo.password"} label="Passwort" control={control} type="password"
                                  rules={{required: "Passwort fehlt!"}}/>
              <FormInputComponent name={"pontonInfo.confirmPassword"} label="Passwort bestätigen" control={control} type="password"
                                  rules={{validate: (value: string) => (watch ? value === watch("pontonInfo.password") : false) || "Ponton Passwords do not match"}}/>
          </>
      }
      <div style={{flex: "0 1 40px"}}>
        <Box sx={{display: 'flex', flexDirection: 'row', pt: 2}}>
          <Box sx={{flex: '1 1 auto'}}/>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={pending}>
            Finish
          </Button>
        </Box>
      </div>
    </Box>
  )
}

export default RegistrationPontonPage;