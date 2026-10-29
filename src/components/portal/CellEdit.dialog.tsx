import {FC, FormEvent, ReactNode} from "react";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, PaperProps} from "@mui/material";
import { create } from "zustand";
import {saveFailedMessage} from "../../services/portal.service";


type CellEditDialogState = {
  children?: ReactNode
  onSubmit: () => Promise<unknown> | void;
  onClose: () => void;
  header?: string;
  error?: string;
}

const useCellEditDialogStore = create<CellEditDialogState>((set) => ({
  onSubmit: () => {},
  onClose: () => set({children: undefined, error: undefined})
}))

export const editDialog = (children: ReactNode, header: string, onSubmit: () => Promise<unknown> | void) => {
  useCellEditDialogStore.setState({children, onSubmit, header, error: undefined});
}

export const CellEditDialog: FC = () => {
  const {children, onSubmit, onClose, header, error} = useCellEditDialogStore();
  return (
    <Dialog open={Boolean(children)} onClose={onClose}
      // MUI 5.14 types PaperProps without `component`; Paper renders the form at runtime.
      PaperProps={{
        component: 'form',
        onSubmit: async (event: FormEvent) => {
          event.preventDefault();
          // close only when the save went through; a failed save stays open with the error
          try {
            await onSubmit()
            onClose()
          } catch (e) {
            useCellEditDialogStore.setState({error: saveFailedMessage(e)})
          }
        },
      } as Partial<PaperProps>}
    >
        <DialogTitle>{header}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Update
          </DialogContentText>
          {error && <Alert severity="error">{error}</Alert>}
          {children}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit">Subscribe</Button>
        </DialogActions>
    </Dialog>
  )
}
