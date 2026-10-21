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
  const steps: { label: string, optional?: boolean }[] = [
    {label: 'Allgemein'},
    {label: 'Betreiber'},
    // {label: 'Business'},
    // {label: 'Contact'},
    {label: 'Kommunikation'},
  ];

  // const {handleSubmit, control, watch, formState: {errors}, reset} = useForm<EegRegister>({defaultValues: newEeg})
  const formMethods = useForm<EegRegister>({defaultValues: newEeg, mode: "all"});

  const [open, setOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [message, setMessage] = React.useState<{message: string, severity: "success" | "error" | "warning" | "info" | undefined}>({message: "", severity: "success"});
  const [skipped, setSkipped] = React.useState(new Set<number>());
  const {reset, eeg, rcNumber, isExcelLoaded, excelFile, next, hasNext, prev, hasPrev, removeExcel} = React.useContext(RegistrationContext);

  const isStepOptional = (index: number) => {
    const step = steps[index]
    return step.optional && step.optional;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  useEffect(() => {
    formMethods.reset(eeg);
  }, [eeg])

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    reset()
    // formMethods.reset(eeg);
  };

  const onSubmit = (data: EegRegister) => {
    try {
      Api.eegService.registerEeg(trimEegRegisterData(data))
        .then(r => {
          const results = r?.accounts ?? []
          setMessage({
            message: ["EEG wurde angelegt.", accountSummary(results)].filter(Boolean).join(" "),
            severity: results.some(a => a.status === "failed") ? "warning" : "success"
          })
          setOpen(true)
          handleReset()
        })
        .catch((e: APIError) => {
          console.error("ERROR-Request: ", e, "Code: ", e.code)
          switch (e.code) {
            case 501:
              setMessage({message: e.message, severity: "error"})
              break;
            case 502:
            case 510:
              setMessage({message: e.message, severity: "warning"})
              break;
            default:
              setMessage({message: "Error beim Anlegen des Mitglieds", severity: "error"})
          }
          setOpen(true)
          handleReset()
        })
    } catch (e) {
      console.error("ERROR: ", e)
    }
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
      // case 2:
      //   return <BusinessEegPropertiesComponent control={formMethods.control}/>
      // case 3:
      //   return <AddressEegPropertiesComponent />
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
      {/* a warning (e.g. a login failed) stays until it is closed */}
      <Snackbar autoHideDuration={message.severity === "success" ? 10000 : null} open={open} onClose={handleClose}>
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
            {steps.map((step: { label: string, optional?: boolean }, index) => {
              const stepProps: { completed?: boolean } = {};
              const labelProps: {
                optional?: React.ReactNode;
              } = {};
              if (isStepOptional(index)) {
                labelProps.optional = (
                  <Typography variant="caption">Optional</Typography>
                );
              }
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }
              return (
                <Step key={step.label} {...stepProps}>
                  <StepLabel {...labelProps}>{step.label}</StepLabel>
                </Step>
              );
            })}
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
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{mr: 1}}>
                Skip
              </Button>
            )}
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