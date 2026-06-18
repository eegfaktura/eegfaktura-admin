import {FC, FormEvent, ReactNode} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import { create } from "zustand";


type CellEditDialogState = {
  children?: ReactNode
  onSubmit: () => void;
  onClose: () => void;
  header?: string;
}

const useCellEditDialogStore = create<CellEditDialogState>((set) => ({
  onSubmit: () => {},
  onClose: () => set({children: undefined})
}))

export const editDialog = (children: ReactNode, header: string, onSubmit: () => void) => {
  useCellEditDialogStore.setState({children, onSubmit, header});
}

export const CellEditDialog: FC = () => {
  const {children, onSubmit, onClose, header} = useCellEditDialogStore();
  return (
    <Dialog open={Boolean(children)} onClose={onClose}
      PaperProps={{
        component: 'form',
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSubmit()
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