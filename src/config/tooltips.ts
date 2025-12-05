export type TooltipKey =
  | "openNavigation"
  | "closeNavigation"
  | "manageProjects"
  | "conversationOptions"
  | "closeConversationsPanel"
  | "clearSearch"
  | "addProject";

export const TOOLTIP_COPY: Record<TooltipKey, string> = {
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  manageProjects: "Manage projects",
  conversationOptions: "Open conversation options",
  closeConversationsPanel: "Close conversations panel",
  clearSearch: "Clear search",
  addProject: "Add new project"
};

export const tooltip = (key: TooltipKey) => TOOLTIP_COPY[key];
