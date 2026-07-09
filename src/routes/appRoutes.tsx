import HomePage from "../pages/home/HomePage";
import {RouteType} from "./config";
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RegistrationPage from "../pages/registration/Registration.page";
import RegistrationPontonPage from "../pages/registration/RegistrationPonton.page";
import RegistrationPageLayout from "../pages/registration/RegistrationPageLayout";
import {DeleteForeverTwoTone, EditNoteTwoTone, ManageAccountsTwoTone} from "@mui/icons-material";
import PortalPageLayout from "../pages/portal/PortalPageLayout";
import PortalOverview from "../pages/portal/PortalOverview";
import RawDataDeletePage from "../pages/ops/RawDataDeletePage";

const appRoutes: RouteType[] = [
  {
    element: <RegistrationPageLayout />,
    state: "registration",
    path: "/registration",
    sidebarProps: {
      displayText: "Registration",
      icon: <EditNoteTwoTone />
    },
    child: [
      {
        path: "/registration/register-base",
        element: <RegistrationPage />,
        state: "registration.basedata",
        sidebarProps: {
          displayText: "EEG Registration",
        },
      },
      {
        path: "/registration/register-ponton",
        element: <RegistrationPontonPage />,
        state: "registration.ponton",
        sidebarProps: {
          displayText: "Ponton Registration",
        }
      },
    ]
  },
  {
    element: <PortalPageLayout/>,
    state: "portalManager",
    path: "/portal",
    sidebarProps: {
      displayText: "Portal Manager",
      icon: <ManageAccountsTwoTone/>
    },
  },
  {
    element: <RawDataDeletePage/>,
    state: "rawDataDelete",
    path: "/rawdata-delete",
    sidebarProps: {
      displayText: "Energiedaten löschen",
      icon: <DeleteForeverTwoTone/>
    },
  }
  //   child: [
  //     {
  //       path: "/portal/manager-overview",
  //       element: <PortalOverview />,
  //       state: "manager.overview",
  //       sidebarProps: {
  //         displayText: "EEG Mitglieder",
  //       },
  //     },
  //     {
  //       path: "/portal/manager-billing",
  //       element: <RegistrationPontonPage />,
  //       state: "manager.billing",
  //       sidebarProps: {
  //         displayText: "EEG Rechungen",
  //       }
  //     },
  //   ]
  // }
];

export default appRoutes;