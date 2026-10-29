import {FC, FormEvent} from "react";
import {
  Alert,
  Button, Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  PaperProps, RadioGroup, TextField
} from "@mui/material";
import {Controller, useForm} from "react-hook-form";
import {EegParticipant} from "../../../model/eeg.model";
import {create} from "zustand";
import {saveFailedMessage} from "../../../services/portal.service";

type ParticipantEditDialogState = {
  row?: EegParticipant
  onClose: () => void;
  onUpdate: (data: EegParticipant) => Promise<unknown> | void;
  error?: string;
}

const useParticipantEditDialogStore = create<ParticipantEditDialogState>((set) => ({
  onUpdate: (data: EegParticipant) => {},
  onClose: () => set({row: undefined, error: undefined})
}))

export const openParticipantDialog = (row: EegParticipant, onUpdate: (data: EegParticipant) => Promise<unknown> | void) => {
  useParticipantEditDialogStore.setState({row, onUpdate, error: undefined});
}

export const ParticipantCellEditDialog: FC = () => {
  const {row, onUpdate, onClose, error} = useParticipantEditDialogStore();

  const { handleSubmit, control, formState } = useForm<EegParticipant>({
    values: row ?
      {...row} : {} as EegParticipant,
  });

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth
            // MUI 5.14 types PaperProps without `component`; Paper renders the form at runtime.
            PaperProps={{
              component: 'form',
              onSubmit: async (event: FormEvent) => {
                event.preventDefault();
                // close only when the save went through; a failed save stays open with the error
                try {
                  await handleSubmit(onUpdate)(event)
                  onClose()
                } catch (e) {
                  useParticipantEditDialogStore.setState({error: saveFailedMessage(e)})
                }
              },
            } as Partial<PaperProps>}
    >
      <DialogTitle>Participant</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Update Mitglied
        </DialogContentText>
        {error && <Alert severity="error">{error}</Alert>}
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