import {AppBar, Drawer, List, ListSubheader, Toolbar} from "@mui/material";
import sizeConfigs from "../../configs/sizeConfigs";
import appRoutes from "../../routes/appRoutes";
import SidebarItem from "./SidebarItem";
import SidebarItemCollapse from "./SidebarItemCollapse";
import React from "react";

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sizeConfigs.sidebar.width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: sizeConfigs.sidebar.width,
          boxSizing: "border-box",
          borderRight: "0px",
        }
      }}
    >
      <List disablePadding>

        <AppBar position="static" color="primary">
          <Toolbar sx={{ marginBottom: "20px" }}>
            <div style={{fontSize: "22px"}}><span>eeg</span><span style={{color: "#79dfb4"}}>Faktura Admin</span></div>
          </Toolbar>
        </AppBar>
        {appRoutes.map((route, index) => (
          route.sidebarProps ? (
            <React.Fragment key={index}>
              {route.sidebarProps.subheader && <ListSubheader disableSticky>{route.sidebarProps.subheader}</ListSubheader>}
              {route.child ? (
                <SidebarItemCollapse item={route} />
              ) : (
                <SidebarItem item={route} />
              )}
            </React.Fragment>
          ) : null
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;