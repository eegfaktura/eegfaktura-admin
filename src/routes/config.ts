import { ReactNode } from "react";

export type RouteType = {
  element: ReactNode,
  state: string,
  index?: boolean,
  path?: string,
  child?: RouteType[],
  sidebarProps?: {
    displayText: string,
    icon?: ReactNode;
    // a heading in the menu above this entry, for a group of entries
    subheader?: string;
  };
};