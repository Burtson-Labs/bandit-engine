# Expired Subscription Handling

The Bandit Engine now includes comprehensive support for handling expired subscriptions with user-friendly UI components and automatic detection.

## Components

### SubscriptionExpiredModal

A modal dialog that notifies users when their subscription has expired.

**Props:**
- `open: boolean` - Controls modal visibility
- `onClose: () => void` - Called when modal is closed
- `onNavigateHome?: () => void` - Optional callback for home navigation
- `onManageSubscription?: () => void` - Optional callback for subscription management
- `userEmail?: string` - User's email to display in the modal
- `allowContinue?: boolean` - Whether to show a "Continue" button (default: false)

**Usage:**
```tsx
import { SubscriptionExpiredModal } from '@burtson-labs/bandit-engine';

const MyComponent = () => {
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const navigate = useNavigate();

  return (
    <SubscriptionExpiredModal
      open={showExpiredModal}
      onClose={() => setShowExpiredModal(false)}
      onNavigateHome={() => navigate('/')}
      onManageSubscription={() => window.open('/billing', '_blank')}
      userEmail="user@example.com"
    />
  );
};
```

### SubscriptionExpiredGuard

A wrapper component that automatically detects expired subscriptions and shows the modal.

**Props:**
- `children: React.ReactNode` - Components to protect
- `onNavigateHome?: () => void` - Optional callback for home navigation
- `onManageSubscription?: () => void` - Optional callback for subscription management
- `userEmail?: string` - User's email to display in the modal
- `allowContinue?: boolean` - Whether to allow continuing with expired subscription

**Usage:**
```tsx
import { SubscriptionExpiredGuard, Chat } from '@burtson-labs/bandit-engine';

const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <SubscriptionExpiredGuard
      onNavigateHome={() => navigate('/')}
      onManageSubscription={() => window.open('/billing', '_blank')}
    >
      <Chat />
    </SubscriptionExpiredGuard>
  );
};
```

## Feature Flag Integration

The expired subscription handling works seamlessly with the feature flag system:

```tsx
import { useFeatures } from '@burtson-labs/bandit-engine';

const MyComponent = () => {
  const { isExpiredTier, getCurrentTier } = useFeatures();
  
  if (isExpiredTier()) {
    // Handle expired state
    return <ExpiredSubscriptionMessage />;
  }
  
  // Normal component logic
  return <RegularContent />;
};
```

## JWT Integration

The system automatically detects expired subscriptions from JWT tokens:

```json
{
  "sub": "user@example.com",
  "subscriptionType": "expired",
  "tier": "expired",
  "exp": 1234567890
}
```

## Automatic Redirects

For parent applications, you can check for expired subscriptions on login:

```tsx
import { useFeatures } from '@burtson-labs/bandit-engine';

const LoginHandler = () => {
  const { isExpiredTier } = useFeatures();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isExpiredTier()) {
      navigate('/manage-subscription');
    }
  }, [isExpiredTier, navigate]);
  
  return null;
};
```

## Styling

The modal uses Material-UI components and respects your theme configuration:

```tsx
// The modal automatically adapts to dark/light themes
// and uses appropriate warning colors and icons
```

## Error Handling

The components include comprehensive error handling:

- Graceful degradation if user data is unavailable
- Fallback navigation if callbacks aren't provided
- Proper modal state management to prevent multiple instances

## Best Practices

1. **Always provide navigation callbacks** - Users should have clear paths forward
2. **Use the guard component** - Wrap protected features for automatic handling
3. **Test the full flow** - From expired detection to subscription renewal
4. **Provide clear messaging** - Users should understand what happened and what to do next

## Integration Example

Here's a complete example of integrating expired subscription handling:

```tsx
// pages/chat/chat-page.tsx
import React from "react";
import { Chat, SubscriptionExpiredGuard } from "@burtson-labs/bandit-engine";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <SubscriptionExpiredGuard
      onNavigateHome={() => navigate("/")}
      onManageSubscription={() => window.open("/billing", "_blank")}
    >
      <Chat />
    </SubscriptionExpiredGuard>
  );
};

export default ChatPage;
```

This ensures that any user with an expired subscription will be automatically prompted to take action while preventing access to protected features.
