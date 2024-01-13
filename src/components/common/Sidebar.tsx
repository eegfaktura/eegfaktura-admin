import {AppBar, Drawer, List, Toolbar} from "@mui/material";
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
          // backgroundColor: colorConfigs.sidebar.bg,
          // color: colorConfigs.sidebar.color
        }
      }}
    >
      <List disablePadding>

        <AppBar position="static" color="primary">
          <Toolbar sx={{ marginBottom: "20px" }}>
            <div style={{fontSize: "22px"}}><span>EEG </span><span style={{color: "#79dfb4"}}>Faktura ADMIN</span></div>
          </Toolbar>
        </AppBar>
        {/*<Toolbar sx={{ marginBottom: "20px" }}>*/}
        {/*  /!*<Stack*!/*/}
        {/*  /!*  sx={{ width: "100%" }}*!/*/}
        {/*  /!*  direction="row"*!/*/}
        {/*  /!*  justifyContent="center"*!/*/}
        {/*  /!*>*!/*/}
        {/*  /!*  <Avatar src={assets.images.logo} />*!/*/}
        {/*  /!*</Stack>*!/*/}
        {/*  <div>EEG Faktura ADMIN</div>*/}
        {/*</Toolbar>*/}
        {appRoutes.map((route, index) => (
          route.sidebarProps ? (
            route.child ? (
              <SidebarItemCollapse item={route} key={index} />
            ) : (
              <SidebarItem item={route} key={index} />
            )
          ) : null
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;