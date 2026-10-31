import {FC} from "react";
import {GridRenderCellParams} from "@mui/x-data-grid";
import {Metering} from "../../../model/eeg.model";
import {AdminUpdateData} from "../../../model/admin.model";
import {Api} from "../../../services/eeg.service";
import {Controller, useForm} from "react-hook-form";
import {editDialog} from "../CellEdit.dialog";
import {FormControl} from "@mui/material";
import {DatePicker} from "@mui/x-date-pickers";
import moment from "moment/moment";
import {CellEditElement} from "./CellEdit.element";

// The backend takes epoch ms and keeps the calendar day of that moment in its own zone (Europe/Berlin). Noon UTC is the
// picked day there whatever the browser's zone, local midnight is not (261005-ca3). A date of the row that was not
// touched is epoch ms from the admin-backend and goes back as it came. Unset stays unset: moment(undefined) is now.
export const dayToEpochMs = (value: Date | number | undefined | null): string | undefined => {
  if (value instanceof Date) {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12).toString()
  }
  return value === undefined || value === null ? undefined : value.toString()
}

export const DateCellEditor: FC<{params: GridRenderCellParams<Metering, any>, label: string, header: string, proto: string, propertyName: keyof Metering, updateMeter: (meter: Metering) => void}> = ({params, label, header, proto, propertyName, updateMeter}) => {

  const onUpdate = (meter: Metering) => {

    let processData = {
      tenant: params.row.tenant!,
      participantId: params.row.participantId,
      meteringPoint: params.row.meteringPoint,
      value: {[propertyName]: dayToEpochMs((meter as any)[propertyName])}} as AdminUpdateData;

    // returned so the dialog waits for it; a failure keeps the entered value and shows the error there
    return Api.portalService.changeProcessState(proto, processData)
      .then(row => updateMeter(row));
  }

  const { handleSubmit, control } = useForm<Metering>({
    defaultValues: {
      ...params.row
    },
  });

  return (
    <CellEditElement params={params} onStartEdit={(row) => {
      editDialog (
        <div>
          <FormControl>
            <Controller
              rules={{ required: true }}
              control={control}
              name={propertyName}
              render={({ field }) => (<DatePicker
                label={label}
                format="DD.MM.YYYY"
                value={field.value ? moment(field.value as moment.MomentInput) : null}
                onChange={(newValue) => field.onChange((newValue?.isValid() ? newValue.toDate() : null) as unknown as Date)}
                slotProps={{textField: {id: "date", size: "small", required: true, sx: {width: 220}}}}
              />)}
            />
          </FormControl>
        </div>, header, handleSubmit(onUpdate))
    }} />
  )
}