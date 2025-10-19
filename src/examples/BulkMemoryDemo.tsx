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

// Bandit Engine Watermark: BL-WM-B27C-19D8AB
const __banditFingerprint_examples_BulkMemoryDemotsx = 'BL-FP-97DF07-6A87';
const __auditTrail_examples_BulkMemoryDemotsx = 'BL-AU-MGOIKVVC-28MC';
// File: BulkMemoryDemo.tsx | Path: src/examples/BulkMemoryDemo.tsx | Hash: b27c6a87

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, LinearProgress, Alert } from '@mui/material';
import { useVectorStore } from '../hooks/useVectorStore';
import { MemoryUtils } from '../utils/memoryUtils';

interface BatchProgressState {
  current: number;
  total: number;
  message: string;
}

interface BatchOperationSummary {
  mode: string;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
}

interface BatchOperationResult {
  success: boolean;
  message?: string;
  summary?: BatchOperationSummary;
  duration?: number;
  warnings?: string[];
  errors?: string[];
}

/**
 * Bulk Memory Operations Demo Component
 * 
 * Demonstrates the new batch memory functionality including:
 * - Batch creation with different modes
 * - Progress reporting
 * - Error handling
 * - Memory validation
 * - Import from IndexedDB
 */
export const BulkMemoryDemo: React.FC = () => {
  const { 
    isVectorEnabled, 
    batchCreateMemories, 
    batchCreateMemoriesAdvanced,
    batchImportMemories 
  } = useVectorStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgressState>({ current: 0, total: 0, message: '' });
  const [results, setResults] = useState<BatchOperationResult | null>(null);

  // Sample memories for demonstration
  const sampleMemories = [
    {
      content: "Remember to always backup important data before system updates",
      title: "System Backup Reminder",
      tags: ["backup", "system", "reminder"]
    },
    {
      content: "The best coding practices include writing clean, readable code with proper documentation",
      title: "Coding Best Practices",
      tags: ["coding", "best-practices", "documentation"]
    },
    {
      content: "Weekly team standup meetings are scheduled for Mondays at 9 AM",
      title: "Team Meeting Schedule",
      tags: ["meetings", "schedule", "team"]
    },
    {
      content: "Customer feedback shows users prefer dark mode interface for evening usage",
      title: "UI Feedback - Dark Mode",
      tags: ["ui", "feedback", "dark-mode"]
    },
    {
      content: "Database optimization reduced query time by 40% after indexing improvements",
      title: "Database Performance",
      tags: ["database", "performance", "optimization"]
    }
  ];

  const handleBasicBatch = async () => {
    if (!batchCreateMemories) {
      alert('Batch operations not available');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const result = await batchCreateMemories(sampleMemories, 'append', false);
      setResults(result);
    } catch (error) {
      setResults({ 
        success: false, 
        message: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdvancedBatch = async () => {
    if (!batchCreateMemoriesAdvanced) {
      alert('Advanced batch operations not available');
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setProgress({ current: 0, total: 0, message: '' });

    try {
      const result = await batchCreateMemoriesAdvanced(sampleMemories, {
        mode: 'append',
        chunkSize: 2, // Small chunks for demo
        validateContent: true,
        onProgress: (current: number, total: number, message: string) => {
          setProgress({ current, total, message });
        }
      });
      setResults(result);
    } catch (error) {
      setResults({ 
        success: false, 
        message: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFromLocal = async () => {
    if (!batchImportMemories) {
      alert('Import operations not available');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const result = await batchImportMemories(true, 'append');
      setResults(result);
    } catch (error) {
      setResults({ 
        success: false, 
        message: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validateSampleMemories = () => {
    const validation = MemoryUtils.validateMemories(sampleMemories);
    const estimate = MemoryUtils.estimateBatchOperation(
      sampleMemories.length,
      sampleMemories.reduce((sum, m) => sum + m.content.length, 0) / sampleMemories.length
    );

    alert(`Validation Results:
Valid: ${validation.valid.length}
Invalid: ${validation.invalid.length}

Estimation:
Time: ${estimate.estimatedTimeMinutes} minutes
Tokens: ${estimate.estimatedTokens}
Recommended chunk size: ${estimate.recommendedChunkSize}
Warnings: ${estimate.warnings.join(', ') || 'None'}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Bulk Memory Operations Demo
      </Typography>
      
      <Alert severity={isVectorEnabled ? 'success' : 'warning'} sx={{ mb: 3 }}>
        Vector Database: {isVectorEnabled ? 'Enabled' : 'Disabled'}
        {!isVectorEnabled && ' (Using IndexedDB fallback)'}
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sample Memories ({sampleMemories.length} items)
        </Typography>
        {sampleMemories.map((memory, index) => (
          <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2">{memory.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {memory.content.substring(0, 100)}...
            </Typography>
            <Typography variant="caption" color="primary">
              Tags: {memory.tags.join(', ')}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          onClick={validateSampleMemories}
          disabled={isProcessing}
        >
          Validate Memories
        </Button>
        
        <Button 
          variant="contained" 
          onClick={handleBasicBatch}
          disabled={isProcessing}
        >
          Basic Batch Create
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleAdvancedBatch}
          disabled={isProcessing}
        >
          Advanced Batch Create
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleImportFromLocal}
          disabled={isProcessing}
        >
          Import from Local
        </Button>
      </Box>

      {isProcessing && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {progress.message || 'Processing...'}
          </Typography>
          <LinearProgress 
            variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
            value={progress.total > 0 ? (progress.current / progress.total) * 100 : undefined}
          />
          {progress.total > 0 && (
            <Typography variant="caption" color="text.secondary">
              {progress.current} / {progress.total}
            </Typography>
          )}
        </Box>
      )}

      {results && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          <Alert severity={results.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {results.message}
          </Alert>
          
          {results.summary && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Summary:</Typography>
              <Typography variant="body2">• Mode: {results.summary.mode}</Typography>
              <Typography variant="body2">• Total Processed: {results.summary.totalProcessed}</Typography>
              <Typography variant="body2">• Success: {results.summary.successCount}</Typography>
              <Typography variant="body2">• Failed: {results.summary.failureCount}</Typography>
              <Typography variant="body2">• Skipped: {results.summary.skippedCount}</Typography>
            </Box>
          )}

          {results.duration && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Duration: {(results.duration / 1000).toFixed(1)}s
            </Typography>
          )}

          {results.warnings && results.warnings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="warning.main">Warnings:</Typography>
              {results.warnings.map((warning: string, index: number) => (
                <Typography key={index} variant="body2" color="warning.main">
                  • {warning}
                </Typography>
              ))}
            </Box>
          )}

          {results.errors && results.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="error.main">Errors:</Typography>
              {results.errors.slice(0, 5).map((error: string, index: number) => (
                <Typography key={index} variant="body2" color="error.main">
                  • {error}
                </Typography>
              ))}
              {results.errors.length > 5 && (
                <Typography variant="body2" color="text.secondary">
                  ... and {results.errors.length - 5} more errors
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default BulkMemoryDemo;
