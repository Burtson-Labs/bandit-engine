#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Runtime License Enforcement
  This file is protected intellectual property.
*/

// This function gets injected into the main bundle and runs at runtime
const runtimeLicenseCheck = `
// Bandit Engine Runtime Protection - DO NOT REMOVE
(function() {
  const __bl_check = () => {
    const scripts = document.querySelectorAll('script');
    const hasValidLicense = Array.from(scripts).some(s => 
      s.textContent && s.textContent.includes('© 2025 Burtson Labs')
    );
    
    if (!hasValidLicense && typeof window !== 'undefined') {
      const violations = [
        '⚖️ LICENSE VIOLATION DETECTED',
        '🚫 Burtson Labs watermarks have been removed',
        '📋 This usage is being logged for legal action',
        '🔒 Contact legal@burtson.ai immediately'
      ];
      console.warn(violations.join('\\n'));
      
      // Add visible watermark if license is missing
      if (document.body) {
        const watermark = document.createElement('div');
        watermark.innerHTML = '⚖️ UNLICENSED BURTSON LABS SOFTWARE';
        watermark.style.cssText = \`
          position: fixed; top: 0; right: 0; z-index: 999999;
          background: #ff0000; color: white; padding: 10px;
          font-family: monospace; font-size: 12px; font-weight: bold;
          border: 2px solid #fff; box-shadow: 0 0 10px rgba(255,0,0,0.5);
          pointer-events: none; opacity: 0.9;
        \`;
        document.body.appendChild(watermark);
      }
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __bl_check);
  } else {
    __bl_check();
  }
  
  // Run check periodically
  setInterval(__bl_check, 30000);
})();

// Additional runtime fingerprints
const __runtimeFingerprint = {
  bl_id: '${Date.now().toString(36)}',
  bl_hash: '${Math.random().toString(36).substring(2)}',
  bl_check: new Date().toISOString()
};

if (typeof window !== 'undefined') {
  window.__banditLicense = __runtimeFingerprint;
}
`;

module.exports = { runtimeLicenseCheck };
