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

// Bandit Engine Watermark: BL-WM-BC64-AC5E1F
const __banditFingerprint_modals_SubscriptionExpiredModaltsx = 'BL-FP-856C24-2817';
const __auditTrail_modals_SubscriptionExpiredModaltsx = 'BL-AU-MGOIKVVL-VM7F';
// File: SubscriptionExpiredModal.tsx | Path: src/modals/SubscriptionExpiredModal.tsx | Hash: bc642817

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  Stack
} from '@mui/material';
import {
  Warning as WarningIcon,
  Home as HomeIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';

export interface SubscriptionExpiredModalProps {
  open: boolean;
  onNavigateHome?: () => void;
  onManageSubscription?: () => void;
  onClose?: () => void;
  userEmail?: string;
}

/**
 * Modal shown when user has an expired subscription
 * Provides options to navigate home or manage subscription
 */
export const SubscriptionExpiredModal: React.FC<SubscriptionExpiredModalProps> = ({
  open,
  onNavigateHome,
  onManageSubscription,
  onClose,
  userEmail
}) => {
  
  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      // Default: try to navigate to parent app
      window.location.href = '/';
    }
  };

  const handleManageSubscription = () => {
    if (onManageSubscription) {
      onManageSubscription();
    } else {
      // Default: try to navigate to subscription management
      window.location.href = '/manage-subscription';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={!onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[10]
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h5" component="span" fontWeight="bold">
            Subscription Expired
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Your subscription has expired and access to features has been restricted.
            </Typography>
          </Alert>
          
          {userEmail && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Account: <strong>{userEmail}</strong>
            </Typography>
          )}
          
          <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            To continue using all features, please renew your subscription or return to the main application.
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'background.paper', 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1, 
            p: 2, 
            mt: 2 
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              <strong>What's affected:</strong> All premium features including document upload, voice controls, 
              advanced search, and admin dashboard access have been disabled until your subscription is renewed.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: 'center' }}>
        <Button
          onClick={handleNavigateHome}
          variant="outlined"
          startIcon={<HomeIcon />}
          size="large"
          sx={{ minWidth: 140 }}
        >
          Go Home
        </Button>
        
        <Button
          onClick={handleManageSubscription}
          variant="contained"
          startIcon={<CreditCardIcon />}
          size="large"
          color="primary"
          sx={{ minWidth: 140 }}
        >
          Renew Subscription
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionExpiredModal;
