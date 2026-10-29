import {FC, FormEvent, ReactNode} from "react";
import {create} from "zustand";
import {submitAndClose} from "./submitAndClose";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, PaperProps} from "@mui/material";

type EditDialogState<T> = {
  children?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  header?: string;
  values?: T
}

type EditDialogState1 = {
  children?: ReactNode
  onSubmit: (event: FormEvent) => Promise<unknown> | void;
  onClose: () => void;
  header?: string;
  error?: string;
  pending?: boolean;
}

const useEditDialogStore = <T,>() =>
  create<EditDialogState<T>>((set) => ({
    onSubmit: (event: FormEvent<HTMLFormElement>) => {},
    onClose: () => set({children: undefined}),
}))

const useEditDialogStore1 = create<EditDialogState1>((set) => ({
    onSubmit: (event: FormEvent) => {},
    onClose: () => set({children: undefined, error: undefined}),
  }))

export const useOpenDialog = <T,>(children: ReactNode,
                               header: string, onSubmit: (event: FormEvent<HTMLFormElement>) => void,
                               values: T) => {
  useEditDialogStore<T>().setState({children, onSubmit, header, values});
}

export const openDialog = (children: ReactNode,
                                  header: string, onSubmit: (event: FormEvent) => Promise<unknown> | void) => {
  useEditDialogStore1.setState({children, onSubmit, header, error: undefined, pending: false});
}

export const EditDialogProvider: FC = () => {
  const {children, onSubmit, onClose, header, error, pending} = useEditDialogStore1();
  return (
    <Dialog open={Boolean(children)} onClose={onClose}
            // MUI 5.14 types PaperProps without `component`; Paper renders the form at runtime.
            PaperProps={{
              component: 'form',
              onSubmit: async (event: FormEvent) => {
                event.preventDefault();
                await submitAndClose(useEditDialogStore1, "onSubmit", () => onSubmit(event), onClose)
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