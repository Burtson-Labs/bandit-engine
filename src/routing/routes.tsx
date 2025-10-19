/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-B667-B7F977
const __banditFingerprint_routing_routestsx = 'BL-FP-CED1BD-956D';
const __auditTrail_routing_routestsx = 'BL-AU-MGOIKVVP-8XSF';
// File: routes.tsx | Path: src/routing/routes.tsx | Hash: b667956d

import { ReactElement } from "react";
import Chat from "../chat/chat";
import ModelManagement from "../management/management";

interface Route {
  path: string;
  title: string;
  element: ReactElement;
}

const ALL_ROUTES: ReadonlyArray<Route> = [
  {
    path: "/chat",
    title: "Chat",
    element: <Chat />,
  },
  {
    path: "/management",
    title: "Mgmt",
    element: <ModelManagement />,
  },
];

const routes = ALL_ROUTES.slice();

export default routes;
