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

// Bandit Engine Watermark: BL-WM-C86A-7D6AB0
const __banditFingerprint_components_NotificationProvidertsx = 'BL-FP-8FB104-1724';
const __auditTrail_components_NotificationProvidertsx = 'BL-AU-MGOIKVW2-2OVE';
// File: NotificationProvider.tsx | Path: src/shared/components/NotificationProvider.tsx | Hash: c86a1724

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export interface NotificationConfig {
  message: string;
  severity?: AlertColor;
  duration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

export interface NotificationContextType {
  showNotification: (config: NotificationConfig | string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number;
  defaultPosition?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultDuration = 4000,
  defaultPosition = { vertical: 'bottom', horizontal: 'left' }
}) => {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
    duration: number;
    anchorOrigin: {
      vertical: 'top' | 'bottom';
      horizontal: 'left' | 'center' | 'right';
    };
  }>({
    open: false,
    message: '',
    severity: 'info',
    duration: defaultDuration,
    anchorOrigin: defaultPosition
  });

  const showNotification = (config: NotificationConfig | string) => {
    const notificationConfig = typeof config === 'string' 
      ? { message: config, severity: 'info' as AlertColor }
      : config;

    setNotification({
      open: true,
      message: notificationConfig.message,
      severity: notificationConfig.severity || 'info',
      duration: notificationConfig.duration || defaultDuration,
      anchorOrigin: notificationConfig.anchorOrigin || defaultPosition
    });
  };

  const showError = (message: string) => {
    showNotification({ message, severity: 'error' });
  };

  const showSuccess = (message: string) => {
    showNotification({ message, severity: 'success' });
  };

  const showWarning = (message: string) => {
    showNotification({ message, severity: 'warning' });
  };

  const showInfo = (message: string) => {
    showNotification({ message, severity: 'info' });
  };

  const handleClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        anchorOrigin={notification.anchorOrigin}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
