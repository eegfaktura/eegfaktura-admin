import React, {FC, useEffect} from "react";
import {Alert, Box, Button, IconButton, Step, StepLabel, Stepper, Typography} from "@mui/material";

import {FormProvider, useForm} from "react-hook-form";
import {AccountInfo, AccountResult, EegRegister} from "../../model/eeg.model";
import CommonEegPropertiesComponent from "../../components/registration/CommonEegProperties.component";
import UserEegPropertiesComponent from "../../components/registration/UserEegProperties.component";
import PontonPropertiesComponent from "../../components/registration/PontonProperties.component";
import {Api, APIError} from "../../services/eeg.service";
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import {RegistrationContext} from "../../hooks/RegistrationContext";
import {ArrowLeft, ArrowRight} from "@mui/icons-material";

const STATUS_TEXT: Record<AccountResult["status"], string> = {
  created: "angelegt",
  linked: "bestehender Account, EEG ergänzt",
  failed: "fehlgeschlagen",
}

// One line per login of the registration, e.g. „a@b.at: angelegt; c@d.at: fehlgeschlagen (E-Mail-Adresse ungültig)“.
export const accountSummary = (results: AccountResult[]): string =>
  results.length === 0 ? "" : "Logins: " + results
    .map(a => `${a.email}: ${STATUS_TEXT[a.status] ?? a.status}${a.status === "failed" && a.message ? ` (${a.message})` : ""}`)
    .join("; ")

// the EEG exists, nothing was changed: the form stays for a correction (261015-ca1)
const EegExists = 409

export const registerErrorMessage = (e: APIError): {message: string, severity: "error" | "warning", sticky?: boolean} => {
  switch (e.code) {
    case EegExists:
      return {message: e.message, severity: "error", sticky: true}
    case 501:
      return {message: e.message, severity: "error"}
    case 502:
    case 510:
      return {message: e.message, severity: "warning"}
    default:
      return {message: "Error beim Anlegen des Mitglieds", severity: "error"}
  }
}

const RegistrationPage: FC = () => {

  const newEeg: EegRegister = {
    tenant: "", rcNumber: "", communityId: "", online: false, name: "", settlement: "", description: "",
    user: {firstname: "", lastname: "", email: "", username: "", password: "", confirmPassword: ""},
    businessInfo: {legal: "verein", settlementInterval: "MONTHLY"},
    grid: {id: "", name: "", area: "LOCAL", allocation: "DYNAMIC"},
    pontonInfo: {
      host: "",
      password: "",
      username: "",
      port: 0,
      confirmPassword: "",
      domain: "edanet.at",
      pontonCommType: "NONE"
    },
    accountInfo: {iban: "", sepa: false, owner: ""} as AccountInfo,
    contact: {
      street: "",
      city: "",
      zip: "",
      streetNumber: "",
      phone: "",
    },
    accounts: [],
  }
  const steps = ['Allgemein', 'Betreiber', 'Kommunikation'];

  // const {handleSubmit, control, watch, formState: {errors}, reset} = useForm<EegRegister>({defaultValues: newEeg})
  const formMethods = useForm<EegRegister>({defaultValues: newEeg, mode: "all"});

  const [open, setOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [message, setMessage] = React.useState<{message: string, severity: "success" | "error" | "warning" | "info" | undefined, sticky?: boolean}>({message: "", severity: "success"});
  const {reset, eeg, rcNumber, isExcelLoaded, excelFile, next, hasNext, prev, hasPrev} = React.useContext(RegistrationContext);

  useEffect(() => {
    formMethods.reset(eeg);
  }, [eeg, formMethods])

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    reset()
    // formMethods.reset(eeg);
  };

  const onSubmit = (data: EegRegister) => {
    Api.eegService.registerEeg(trimEegRegisterData(data))
      .then(r => {
        const results = r?.accounts ?? []
        const failed = results.some(a => a.status === "failed")
        setMessage({
          message: ["EEG wurde angelegt.", accountSummary(results)].filter(Boolean).join(" "),
          severity: failed ? "warning" : "success",
          sticky: failed,
        })
        setOpen(true)
        handleReset()
      })
      .catch((e: APIError) => {
        console.error("ERROR-Request: ", e, "Code: ", e.code)
        setMessage(registerErrorMessage(e))
        setOpen(true)
        if (e.code !== EegExists) {
          handleReset()
        }
      })
  };

  const trimEegRegisterData = (data: EegRegister): EegRegister => {
    data.name = data.name.trim()
    data.communityId = data.communityId.trim();
    data.description = data.description.trim();
    data.rcNumber = data.rcNumber.trim();
    data.settlement = data.settlement.trim();
    data.accountInfo.iban = data.accountInfo.iban.trim();
    data.accountInfo.owner = data.accountInfo.owner.trim();
    data.contact.city = data.contact.city.trim();
    data.contact.phone = data.contact.phone.trim();
    data.contact.streetNumber = data.contact.streetNumber.trim();
    data.contact.zip = data.contact.zip.trim();
    data.contact.street = data.contact.street.trim();
    data.pontonInfo.host = data.pontonInfo.host.trim();
    data.pontonInfo.domain = data.pontonInfo.domain.trim();
    data.grid.name = data.grid.name.trim();
    data.grid.id = data.grid.id.trim();
    data.user.email = data.user.email.trim();
    data.user.firstname = data.user.firstname.trim();
    data.user.lastname = data.user.lastname.trim();
    data.user.username = data.user.username.trim()
    const accounts = (data.accounts ?? []).map(a => ({firstname: a.firstname.trim(), lastname: a.lastname.trim(), email: a.email.trim()}))
    // empty: the backend sets up the login for the operator, as before
    data.accounts = accounts.length > 0 ? accounts : undefined

    return data;
  }

  const renderStep = (currentStep: number) => {
    switch (currentStep) {
      case 0:
        return <CommonEegPropertiesComponent/>
      case 1:
        return <UserEegPropertiesComponent />
      case 2:
        return <PontonPropertiesComponent />
      default:
        return <></>
    }
  }

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
    <Box display="flex" flexDirection="column" height="100%" color={"primary.main"} bgcolor={"background.paper"} overflow={"auto"} padding={"24px"}>
      {/* a failed login stays until it is closed */}
      <Snackbar autoHideDuration={message.sticky ? null : 10000} open={open} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={message.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message.message}
        </Alert>
      </Snackbar>
      <FormProvider {...formMethods} >
        <div style={{flex: "1 1 auto"}}>
          <Stepper activeStep={activeStep}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {/*{Object.values(formMethods.formState.errors).map((e, i) => (*/}
          {/*  <div>{e.message}</div>*/}
          {/*))}*/}
          {renderStep(activeStep)}
        </div>
        <div style={{flex: "0 1 40px", paddingBottom: "10px"}}>
          <Box sx={{display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between', alignItems: 'center'}}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{mr: 1}}
            >
              Back
            </Button>
            {isExcelLoaded && (
              <Box sx={{display:'flex', flexDirection:'row', gap:'24px', paddingRight:'20px'}}>
                {/*<IconButton onClick={() => removeExcel()}>*/}
                {/*  <DeleteOutline/>*/}
                {/*</IconButton>*/}
                <Box sx={{flex: '0 0 auto'}}>
                  <Typography fontSize={"0.8em"}>
                    Filename: {excelFile}
                  </Typography>
                  <Typography fontSize={"0.8em"}>
                    RC-Number: {rcNumber()}
                  </Typography>
                </Box>
                <Box sx={{flex: '0 0 auto'}}>
                  <IconButton disabled={!hasPrev()} onClick={() => prev()}>
                    <ArrowLeft />
                  </IconButton>
                  <IconButton disabled={!hasNext()} onClick={() => next()}>
                    <ArrowRight />
                  </IconButton>
                </Box>
              </Box>
            )}
            <Box sx={{flex: '0 0 auto'}}>
            {(activeStep === steps.length - 1) ?
              (<Button variant="contained" onClick={formMethods.handleSubmit(onSubmit)}>
                Finish
              </Button>) :
              (<Button variant="outlined" onClick={formMethods.handleSubmit(handleNext)}>
                Next
              </Button>)
            }
            </Box>
          </Box>
          <span></span>
        </div>
      </FormProvider>
    </Box>
  )
}

export default RegistrationPage;