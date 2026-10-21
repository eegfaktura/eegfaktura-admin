import {Outlet} from "react-router-dom";
import {Box} from "@mui/material";
import colorConfigs from "../../configs/colorConfigs";
import sizeConfigs from "../../configs/sizeConfigs";
import Sidebar from "../common/Sidebar";

const MainLayout = () => {
  return (
    <Box sx={{ display: "flex" }} maxHeight="100vh">
      {/*<Topbar />*/}
      <Box
        component="nav"
        sx={{
          width: sizeConfigs.sidebar.width,
          flexShrink: 0
        }}
      >
        <Sidebar />
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // p: 3,
          width: `calc(100% - ${sizeConfigs.sidebar.width})`,
          height: "100vh",
          minHeight: "100vh",
          // maxHeight: "100vh",
          // overview: "auto",
          backgroundColor: colorConfigs.mainBg
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;