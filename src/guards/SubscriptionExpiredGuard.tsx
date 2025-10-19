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

// Bandit Engine Watermark: BL-WM-5902-E23480
const __banditFingerprint_guards_SubscriptionExpiredGuardtsx = 'BL-FP-AEC5DB-63E7';
const __auditTrail_guards_SubscriptionExpiredGuardtsx = 'BL-AU-MGOIKVVD-17JX';
// File: SubscriptionExpiredGuard.tsx | Path: src/guards/SubscriptionExpiredGuard.tsx | Hash: 590263e7

import React, { useEffect, useState } from 'react';
import { useFeatures } from '../hooks/useFeatures';
import { SubscriptionExpiredModal } from '../modals/SubscriptionExpiredModal';

export interface SubscriptionExpiredGuardProps {
  children: React.ReactNode;
  onNavigateHome?: () => void;
  onManageSubscription?: () => void;
  userEmail?: string;
  /** If true, allows closing the modal and continues with limited access */
  allowContinue?: boolean;
}

/**
 * Guard component that shows subscription expired modal for expired users
 * Wraps children and shows modal when subscription is expired
 */
export const SubscriptionExpiredGuard: React.FC<SubscriptionExpiredGuardProps> = ({
  children,
  onNavigateHome,
  onManageSubscription,
  userEmail,
  allowContinue = false
}) => {
  const { isExpiredTier, getFullEvaluation } = useFeatures();
  const [showModal, setShowModal] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    if (isExpiredTier() && !userDismissed) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isExpiredTier, userDismissed]);

  const handleClose = () => {
    if (allowContinue) {
      setUserDismissed(true);
      setShowModal(false);
    }
  };

  const evaluation = getFullEvaluation();
  const extractedEmail = userEmail || evaluation?.metadata?.jwtFound 
    ? (() => {
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const parts = token.split('.');
            const payload = JSON.parse(atob(parts[1]));
            return payload.email;
          }
        } catch (e) {
          // Ignore errors
        }
        return undefined;
      })()
    : undefined;

  return (
    <>
      {children}
      <SubscriptionExpiredModal
        open={showModal}
        onNavigateHome={onNavigateHome}
        onManageSubscription={onManageSubscription}
        onClose={allowContinue ? handleClose : undefined}
        userEmail={extractedEmail}
      />
    </>
  );
};

export default SubscriptionExpiredGuard;
