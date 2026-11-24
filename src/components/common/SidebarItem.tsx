import {ListItemButton, ListItemIcon, useTheme} from "@mui/material";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "../../redux/store";
import { RouteType } from "../../routes/config";

type Props = {
  item: RouteType;
  // an entry of a submenu: indented below its parent
  nested?: boolean;
};


const SidebarItem = ({ item, nested }: Props) => {
  const theme = useTheme()
  const { appState } = useSelector((state: RootState) => state.appStateSlice);

  return (
    item.sidebarProps && item.path ? (
      <ListItemButton
        component={Link}
        to={item.path}
        sx={{
          "&: hover": {
            backgroundColor: `${theme.palette.primary.main}24`
          },
          backgroundColor: appState === item.state ? `${theme.palette.primary.main}34` : "unset",
          paddingY: "12px",
          paddingRight: "24px",
          paddingLeft: nested ? "40px" : "24px"
        }}
      >
        <ListItemIcon>
          {item.sidebarProps.icon && item.sidebarProps.icon}
        </ListItemIcon>
        {item.sidebarProps.displayText}
      </ListItemButton>
    ) : null
  );
};

export default SidebarItem;