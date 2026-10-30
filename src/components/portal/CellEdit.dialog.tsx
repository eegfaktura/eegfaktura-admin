import {FC, FormEvent, ReactNode} from "react";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, PaperProps} from "@mui/material";
import { create } from "zustand";
import {submitAndClose} from "../common/submitAndClose";


type CellEditDialogState = {
  children?: ReactNode
  onSubmit: () => Promise<unknown> | void;
  onClose: () => void;
  header?: string;
  error?: string;
  pending?: boolean;
}

const useCellEditDialogStore = create<CellEditDialogState>((set) => ({
  onSubmit: () => {},
  onClose: () => set({children: undefined, error: undefined})
}))

export const editDialog = (children: ReactNode, header: string, onSubmit: () => Promise<unknown> | void) => {
  useCellEditDialogStore.setState({children, onSubmit, header, error: undefined, pending: false});
}

export const CellEditDialog: FC = () => {
  const {children, onSubmit, onClose, header, error, pending} = useCellEditDialogStore();
  return (
    <Dialog open={Boolean(children)} onClose={onClose}
      // MUI 5.14 types PaperProps without `component`; Paper renders the form at runtime.
      PaperProps={{
        component: 'form',
        onSubmit: async (event: FormEvent) => {
          event.preventDefault();
          await submitAndClose(useCellEditDialogStore, "onSubmit", onSubmit, onClose)
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
          <Button type="submit" disabled={pending}>Subscribe</Button>
        </DialogActions>
    </Dialog>
  )
}
