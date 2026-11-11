import {saveFailedMessage} from "../../services/portal.service";

type DialogStore = {
  getState: () => any
  setState: (partial: any) => void
}

// One save at a time; the dialog closes only when the save went through, a failed save stays open with the error.
// `owner` is the store key that changes when the dialog is opened again (e.g. for another row): the result of a save
// that was started before is then ignored.
export const submitAndClose = async (store: DialogStore, owner: string, save: () => Promise<unknown> | void,
                                     close: () => void) => {
  if (store.getState().pending) return
  const started = store.getState()[owner]
  const stillOpen = () => store.getState()[owner] === started
  store.setState({pending: true, error: undefined})
  try {
    await save()
    if (stillOpen()) close()
  } catch (e) {
    if (stillOpen()) store.setState({error: saveFailedMessage(e)})
  } finally {
    if (stillOpen()) store.setState({pending: false})
  }
}
