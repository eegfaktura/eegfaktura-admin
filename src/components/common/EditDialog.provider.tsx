import {FC, FormEvent, ReactNode} from "react";
import {create} from "zustand";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";

type EditDialogState<T> = {
  children?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  header?: string;
  values?: T
}

type EditDialogState1 = {
  children?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  header?: string;
}

const useEditDialogStore = <T,>() =>
  create<EditDialogState<T>>((set) => ({
    onSubmit: (event: FormEvent<HTMLFormElement>) => {},
    onClose: () => set({children: undefined}),
}))

const useEditDialogStore1 = create<EditDialogState1>((set) => ({
    onSubmit: (event: FormEvent<HTMLFormElement>) => {},
    onClose: () => set({children: undefined}),
  }))

export const useOpenDialog = <T,>(children: ReactNode,
                               header: string, onSubmit: (event: FormEvent<HTMLFormElement>) => void,
                               values: T) => {
  useEditDialogStore<T>().setState({children, onSubmit, header, values});
}

export const openDialog = (children: ReactNode,
                                  header: string, onSubmit: (event: FormEvent<HTMLFormElement>) => void) => {
  useEditDialogStore1.setState({children, onSubmit, header});
}

export const EditDialogProvider: FC = () => {
  const {children, onSubmit, onClose, header} = useEditDialogStore1();
  return (
    <Dialog open={Boolean(children)} onClose={onClose}
            PaperProps={{
              component: 'form',
              onSubmit: (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                onSubmit(event)
                onClose()
              },
            }}
    >
      <DialogTitle>{header}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Update
        </DialogContentText>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit">Subscribe</Button>
      </DialogActions>
    </Dialog>
  )
}