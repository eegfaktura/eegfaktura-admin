import {FC, FormEvent} from "react";
import {
  Button, Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup, TextField
} from "@mui/material";
import {Controller, useForm} from "react-hook-form";
import {EegParticipant} from "../../../model/eeg.model";
import {create} from "zustand";

type ParticipantEditDialogState = {
  row?: EegParticipant
  onClose: () => void;
  onUpdate: (data: EegParticipant) => void;
}

const useParticipantEditDialogStore = create<ParticipantEditDialogState>((set) => ({
  onUpdate: (data: EegParticipant) => {},
  onClose: () => set({row: undefined})
}))

export const openParticipantDialog = (row: EegParticipant, onUpdate: (data: EegParticipant) => void) => {
  useParticipantEditDialogStore.setState({row, onUpdate});
}

export const ParticipantCellEditDialog: FC = () => {
  const {row, onUpdate, onClose} = useParticipantEditDialogStore();

  const { handleSubmit, control, formState } = useForm<EegParticipant>({
    values: row ?
      {...row} : {} as EegParticipant,
  });

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth
            PaperProps={{
              component: 'form',
              onSubmit: (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                handleSubmit(onUpdate)(event)
                onClose()
              },
            }}
    >
      <DialogTitle>Participant</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Update Mitglied
        </DialogContentText>
        <FormControl fullWidth>
          <Controller
            rules={{ required: true }}
            control={control}
            name="businessRole"
            render={({ field }) => (<RadioGroup row
              aria-labelledby="demo-radio-buttons-group-label"
              {...field}
            >
              <FormControlLabel value="EEG_PRIVATE" control={<Radio />} label="Privat" />
              <FormControlLabel value="EEG_BUSINESS" control={<Radio />} label="Business" />
            </RadioGroup>)}
          />

          <Controller
            rules={{ required: true }}
            control={control}
            name="firstName"
            render={({ field }) => (
              <TextField {...field} label={"Vorname / Firmenname"} variant="filled" fullWidth>
              </TextField>
            )}
          />

          <Controller
            rules={{ required: true }}
            control={control}
            name="lastName"
            render={({ field }) => (
              <TextField {...field} label={"Nachname"} variant="filled">
              </TextField>
            )}
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!formState.isDirty}>Subscribe</Button>
      </DialogActions>
    </Dialog>
  )
}