import {FC} from "react";
import {GridRenderCellParams} from "@mui/x-data-grid";
import {Metering} from "../../../model/eeg.model";
import {AdminUpdateData} from "../../../model/admin.model";
import {Api} from "../../../services/eeg.service";
import {Controller, useForm} from "react-hook-form";
import {editDialog} from "../CellEdit.dialog";
import {FormControl, TextField} from "@mui/material";
import moment from "moment/moment";
import {CellEditElement} from "./CellEdit.element";

export const DateCellEditor: FC<{params: GridRenderCellParams<Metering, any>, label: string, header: string, proto: string, propertyName: keyof Metering, updateMeter: (meter: Metering) => void}> = ({params, label, header, proto, propertyName, updateMeter}) => {

  const convertValue = (value: any) => {
    if (value instanceof Date) {
      return value.getTime().toString()
    }
    return (moment(value).unix()*1000).toString()
  }

  const onUpdate = (meter: Metering) => {

    let processData = {
      tenant: params.row.tenant!,
      participantId: params.row.participantId,
      meteringPoint: params.row.meteringPoint,
      value: {[propertyName]: convertValue((meter as any)[propertyName])}} as AdminUpdateData;

    Api.portalService.changeProcessState(proto, processData)
      .then(row => updateMeter(row))
      .catch(e => reset());
  }

  const { handleSubmit, control, reset } = useForm<Metering>({
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
              render={({ field }) => (<TextField
                id="date"
                label={label}
                type="date"
                sx={{ width: 220, padding: "2 2" }}
                size="small"
                required={true}
                InputLabelProps={{
                  shrink: true,
                }}
                {...field}
                value={moment(field.value as Date).format("YYYY-MM-DD")}
              />)}
            />
          </FormControl>
        </div>, header, handleSubmit(onUpdate))
    }} />
  )
}