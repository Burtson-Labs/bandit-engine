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

// Bandit Engine Watermark: BL-WM-4478-85C0F1
const __banditFingerprint_examples_featureFlagExamplestsx = 'BL-FP-487EB7-2214';
const __auditTrail_examples_featureFlagExamplestsx = 'BL-AU-MGOIKVVD-AA9P';
// File: featureFlagExamples.tsx | Path: src/examples/featureFlagExamples.tsx | Hash: 44782214

import React from 'react';
import { ChatProvider } from '../chat-provider';
import { useFeatures, useFeatureVisibility } from '../hooks/useFeatures';
import { PackageSettings } from '../store/packageSettingsStore';

/**
 * Example 1: Basic Subscription Configuration
 */
const basicSubscriptionSettings: PackageSettings = {
  defaultModel: "gpt-3.5-turbo",
  gatewayApiUrl: "https://api.example.com",
  brandingConfigUrl: "https://cdn.example.com/branding.json",
  
  featureFlags: {
    subscriptionType: "basic",
    rolesClaimKey: "roles",
    jwtStorageKey: "bandit-jwt",
    debug: true // Enable debug logging
  }
};

/**
 * Example 2: Premium Subscription with Custom Overrides
 */
const premiumSubscriptionSettings: PackageSettings = {
  defaultModel: "gpt-4",
  gatewayApiUrl: "https://api.example.com",
  brandingConfigUrl: "https://cdn.example.com/branding.json",
  
  featureFlags: {
    subscriptionType: "premium",
    rolesClaimKey: "roles",
    jwtStorageKey: "bandit-jwt",
    // Override specific features
    featureMatrix: {
      adminDashboardEnabled: false, // Disable admin dashboard even for premium
      semanticSearchPremium: true   // Ensure premium search is enabled
    }
  }
};

/**
 * Example 3: Team/Enterprise Configuration
 */
const teamSettings: PackageSettings = {
  defaultModel: "gpt-4",
  gatewayApiUrl: "https://api.example.com",
  brandingConfigUrl: "https://cdn.example.com/branding.json",
  
  featureFlags: {
    subscriptionType: "team",
    rolesClaimKey: "custom_roles", // Custom JWT claim
    jwtStorageKey: "company-auth-token", // Custom storage key
    adminRole: "super_admin", // Custom admin role name
    debug: false
  }
};

/**
 * Example 4: Open Source / Development Mode
 */
const ossSettings: PackageSettings = {
  defaultModel: "gpt-4",
  gatewayApiUrl: "https://api.example.com",
  brandingConfigUrl: "https://cdn.example.com/branding.json",
  
  featureFlags: {
    // No subscriptionType = OSS mode
    featureMatrix: {
      // All features available, but you can still disable specific ones
      adminDashboardEnabled: true,
      tts: false, // Maybe TTS isn't working in dev
      stt: false
    },
    debug: true
  }
};

/**
 * Example component showing feature flag usage
 */
const FeatureAwareComponent: React.FC = () => {
  const {
    hasFeature,
    hasMemory,
    hasDocumentKnowledge,
    hasTTS,
    isAdmin,
    getCurrentTier,
    isOSSMode,
    isPremiumTier,
    needsUpgrade,
    updateTier
  } = useFeatures();

  const {
    showMemoryToggle,
    showDocumentUpload,
    showVoiceControls,
    showAdminPanel,
    shouldShowUpgradePrompt,
    getUpgradeMessage
  } = useFeatureVisibility();

  return (
    <div>
      <h2>Feature Status</h2>
      <p>Current Tier: {getCurrentTier()}</p>
      <p>Is Admin: {isAdmin() ? 'Yes' : 'No'}</p>
      <p>Is OSS Mode: {isOSSMode() ? 'Yes' : 'No'}</p>
      <p>Is Premium+: {isPremiumTier() ? 'Yes' : 'No'}</p>

      <h3>Available Features</h3>
      <ul>
        <li>Memory: {hasMemory() ? '✅' : '❌'}</li>
        <li>Document Knowledge: {hasDocumentKnowledge() ? '✅' : '❌'}</li>
        <li>Text-to-Speech: {hasTTS() ? '✅' : '❌'}</li>
        <li>Premium Search: {hasFeature('semanticSearchPremium') ? '✅' : '❌'}</li>
      </ul>

      <h3>UI Elements</h3>
      {showMemoryToggle() && <button>Toggle Memory</button>}
      {showDocumentUpload() && <button>Upload Document</button>}
      {showVoiceControls() && <button>Voice Controls</button>}
      {showAdminPanel() && <button>Admin Panel</button>}

      <h3>Upgrade Prompts</h3>
      {shouldShowUpgradePrompt('documentKnowledge') && (
        <div className="upgrade-prompt">
          {getUpgradeMessage('documentKnowledge')}
          <button>Upgrade Now</button>
        </div>
      )}

      <h3>Dynamic Tier Management</h3>
      <button onClick={() => updateTier('basic')}>Switch to Basic</button>
      <button onClick={() => updateTier('premium')}>Switch to Premium</button>
      <button onClick={() => updateTier('team')}>Switch to Team</button>
    </div>
  );
};

/**
 * Example App Configurations
 */

// Basic subscription app
export const BasicApp: React.FC = () => (
  <ChatProvider packageSettings={basicSubscriptionSettings}>
    <FeatureAwareComponent />
  </ChatProvider>
);

// Premium subscription app
export const PremiumApp: React.FC = () => (
  <ChatProvider packageSettings={premiumSubscriptionSettings}>
    <FeatureAwareComponent />
  </ChatProvider>
);

// Team/Enterprise app
export const TeamApp: React.FC = () => (
  <ChatProvider packageSettings={teamSettings}>
    <FeatureAwareComponent />
  </ChatProvider>
);

// Open source app
export const OSSApp: React.FC = () => (
  <ChatProvider packageSettings={ossSettings}>
    <FeatureAwareComponent />
  </ChatProvider>
);

// App with runtime feature flag override
export const CustomApp: React.FC = () => (
  <ChatProvider 
    packageSettings={basicSubscriptionSettings}
    featureFlags={{
      // Runtime override - this takes precedence over packageSettings.featureFlags
      subscriptionType: "premium",
      featureMatrix: {
        tts: true,
        stt: true
      }
    }}
  >
    <FeatureAwareComponent />
  </ChatProvider>
);

/**
 * Usage Examples for Different Scenarios
 */

/*
// 1. SaaS Application with User Subscriptions
const SaaSApp = () => {
  const [userTier, setUserTier] = useState<SubscriptionTier>('basic');
  
  useEffect(() => {
    // Fetch user's subscription from your API
    fetchUserSubscription().then(tier => setUserTier(tier));
  }, []);

  const settings: PackageSettings = {
    // ... other settings
    featureFlags: {
      subscriptionType: userTier,
      jwtStorageKey: "user-auth-token"
    }
  };

  return (
    <ChatProvider packageSettings={settings}>
      <YourApp />
    </ChatProvider>
  );
};

// 2. Enterprise Deployment with Custom Roles
const EnterpriseApp = () => {
  const settings: PackageSettings = {
    // ... other settings
    featureFlags: {
      subscriptionType: "team",
      rolesClaimKey: "enterprise_roles",
      adminRole: "bandit_admin",
      jwtStorageKey: "enterprise-sso-token"
    }
  };

  return (
    <ChatProvider packageSettings={settings}>
      <EnterpriseUI />
    </ChatProvider>
  );
};

// 3. Development/Testing Environment
const DevApp = () => {
  const settings: PackageSettings = {
    // ... other settings
    featureFlags: {
      // No subscriptionType = OSS mode
      debug: true,
      featureMatrix: {
        // Test specific features
        adminDashboardEnabled: true,
        semanticSearchPremium: true
      }
    }
  };

  return (
    <ChatProvider packageSettings={settings}>
      <DevUI />
    </ChatProvider>
  );
};

// 4. White-label Solution with Custom Feature Matrix
const WhiteLabelApp = () => {
  const settings: PackageSettings = {
    // ... other settings
    featureFlags: {
      subscriptionType: "premium",
      featureMatrix: {
        // White-label specific customizations
        adminDashboardEnabled: false, // Hide admin features
        memory: true,
        documentKnowledge: true,
        tts: false, // Voice not supported in this deployment
        stt: false
      }
    }
  };

  return (
    <ChatProvider packageSettings={settings}>
      <WhiteLabelUI />
    </ChatProvider>
  );
};
*/
