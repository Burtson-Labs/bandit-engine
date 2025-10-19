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

// Bandit Engine Watermark: BL-WM-1CAD-948808
const __banditFingerprint_gateway_gatewayexamplests = 'BL-FP-1E21FB-01FE';
const __auditTrail_gateway_gatewayexamplests = 'BL-AU-MGOIKVVT-M6YC';
// File: gateway-examples.ts | Path: src/services/gateway/gateway-examples.ts | Hash: 1cad01fe

/* eslint-disable no-console */

import { GatewayService } from './gateway.service';
import { OpenAIGatewayService } from './openai-gateway.service';
import { AzureOpenAIGatewayService } from './azure-openai-gateway.service';
import { AnthropicGatewayService } from './anthropic-gateway.service';
import { OllamaGatewayService } from './ollama-gateway.service';
import { AIProviderConfig } from '../ai-provider/types/common.types';

/**
 * Example usage of gateway services
 * 
 * This file demonstrates how to use the new gateway-based architecture
 * for consolidating all AI provider requests through a single backend API.
 */

// Example gateway URL - replace with your actual gateway endpoint
const GATEWAY_URL = 'https://your-gateway-api.example.com';

// Example token factory - replace with your authentication logic
const tokenFactory = () => localStorage.getItem('authToken');

/**
 * Example 1: Basic Gateway Service Usage
 */
export async function basicGatewayExample() {
  const gateway = new GatewayService(GATEWAY_URL, tokenFactory);
  
  try {
    // Check gateway health
    const health = await gateway.getHealth().toPromise();
    if (health) {
      console.log('Gateway Status:', health.status);
      console.log('Available Providers:', health.providers);
    }
    
    // List all models from all providers
    const allModels = await gateway.listModels().toPromise();
    console.log('Available Models:', allModels);
    
    // Chat with any provider (provider specified in request)
    const chatStream = gateway.chat({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      stream: true,
      provider: 'openai'
  });
  
  chatStream.subscribe({
    next: (response) => {
      const content = response.choices?.[0]?.delta?.content || '';
      if (content) {
        console.log('Response chunk:', content);
      }
    },
    complete: () => console.log('Chat completed')
  });
  } catch (error) {
    console.error('Error in basic gateway example:', error);
  }
}

/**
 * Example 2: OpenAI Gateway Service
 */
export async function openAIGatewayExample() {
  const openAI = new OpenAIGatewayService(GATEWAY_URL, tokenFactory);
  
  try {
    // Check OpenAI provider health
    const health = await openAI.getHealth().toPromise();
    if (health) {
      console.log('OpenAI Status:', health.openai_status);
    }
  
  // List OpenAI models
  const models = await openAI.listModels().toPromise();
  console.log('OpenAI Models:', models);
  
  // Chat completion
  const chatResponse = await openAI.chat({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing in simple terms.' }
    ],
    temperature: 0.7,
    max_tokens: 150
  }).toPromise();
  
  console.log('OpenAI Response:', chatResponse);
  } catch (error) {
    console.error('Error in OpenAI gateway example:', error);
  }
}

/**
 * Example 3: Azure OpenAI Gateway Service
 */
export async function azureOpenAIGatewayExample() {
  const azure = new AzureOpenAIGatewayService(
    GATEWAY_URL, 
    tokenFactory,
    {
      deploymentName: 'gpt-4-deployment',
      apiVersion: '2024-02-15-preview'
    }
  );
  
  try {
    // Check Azure OpenAI health
    const health = await azure.getHealth().toPromise();
    if (health) {
      console.log('Azure OpenAI Status:', health.azure_openai_status);
    }
    
    // Chat with Azure deployment
    const response = await azure.chat({
      model: 'gpt-4-deployment', // Will use the deployment name
      messages: [{ role: 'user', content: 'What is the capital of France?' }],
      temperature: 0.3
    }).toPromise();
    
    console.log('Azure Response:', response);
  } catch (error) {
    console.error('Error in Azure OpenAI gateway example:', error);
  }
}

/**
 * Example 4: Anthropic Gateway Service
 */
export async function anthropicGatewayExample() {
  const anthropic = new AnthropicGatewayService(GATEWAY_URL, tokenFactory);
  
  try {
    // Check Anthropic health
    const health = await anthropic.getHealth().toPromise();
    if (health) {
      console.log('Anthropic Status:', health.anthropic_status);
    }
    
    // List Claude models
    const models = await anthropic.listModels().toPromise();
    console.log('Anthropic Models:', models);
    
    // Chat with Claude
    const response = await anthropic.chat({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: 'Write a haiku about coding.' }],
      max_tokens: 100
    }).toPromise();
    
    console.log('Claude Response:', response);
  } catch (error) {
    console.error('Error in Anthropic gateway example:', error);
  }
}

/**
 * Example 5: Ollama Gateway Service
 */
export async function ollamaGatewayExample() {
  const ollama = new OllamaGatewayService(GATEWAY_URL, tokenFactory);
  
  try {
    // Check Ollama health
    const health = await ollama.getHealth().toPromise();
    if (health) {
      console.log('Ollama Status:', health.ollama_status);
    }
    
    // List local models
    const models = await ollama.listModels().toPromise();
    console.log('Ollama Models:', models);
    
    // Generate text
    const response = await ollama.generate({
      model: 'llama2',
      prompt: 'The benefits of open source software are',
      stream: false
    }).toPromise();
    
    console.log('Ollama Response:', response);
  } catch (error) {
    console.error('Error in Ollama gateway example:', error);
  }
}

/**
 * Example 6: Using Gateway Provider (Unified Provider Interface)
 */
export async function gatewayProviderExample() {
  const { AIProviderFactory } = await import('../ai-provider/ai-provider.factory');
  
  // OpenAI via Gateway
  const openAIConfig: AIProviderConfig = {
    type: 'gateway',
    gatewayUrl: GATEWAY_URL,
    provider: 'openai',
    tokenFactory
  };
  
  const openAIProvider = AIProviderFactory.createProvider(openAIConfig);
  
  // Use the standard AI provider interface
  const models = await openAIProvider.listModels().toPromise();
  console.log('Models via Gateway Provider:', models);
  
  const chat = openAIProvider.chat({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello from gateway provider!' }],
    stream: false
  });
  
  chat.subscribe(response => {
    console.log('Gateway Provider Response:', response.message.content);
  });
}

/**
 * Example 7: Error Handling and Fallbacks
 */
export async function errorHandlingExample() {
  const gateway = new GatewayService(GATEWAY_URL, tokenFactory);
  
  try {
    // Validate service availability with timeout
    const availability = await gateway.validateServiceAvailability({
      fallbackUrl: 'https://backup-gateway.example.com',
      timeoutMs: 5000
    });
    
    if (availability.isAvailable) {
      console.log('Gateway available at:', availability.url);
      
      // Proceed with requests
      const health = await gateway.getHealth().toPromise();
      console.log('Gateway health:', health);
    } else {
      console.error('Gateway not available');
    }
  } catch (error) {
    console.error('Error connecting to gateway:', error);
    
    // Implement fallback logic here
    // e.g., switch to direct provider or show offline mode
  }
}

/**
 * Example 8: Streaming with Error Handling
 */
export async function streamingExample() {
  const openAI = new OpenAIGatewayService(GATEWAY_URL, tokenFactory);
  
  const stream = openAI.chat({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Write a short story about AI.' }],
    stream: true,
    temperature: 0.8
  });
  
  let fullResponse = '';
  
  stream.subscribe({
    next: (chunk) => {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullResponse += content;
      console.log('Streaming chunk:', content);
    },
    error: (error) => {
      console.error('Streaming error:', error);
    },
    complete: () => {
      console.log('Full response:', fullResponse);
    }
  });
}

/**
 * Example 9: Provider Switching
 */
export async function providerSwitchingExample() {
  const { aiProviderInitService } = await import('../ai-provider-init.service');
  
  // Start with OpenAI via gateway
  await aiProviderInitService.switchProvider({
    type: 'gateway',
    gatewayUrl: GATEWAY_URL,
    provider: 'openai',
    tokenFactory
  });
  
  console.log('Current provider:', aiProviderInitService.getCurrentProviderType());
  
  // Switch to Anthropic via gateway
  await aiProviderInitService.switchProvider({
    type: 'gateway',
    gatewayUrl: GATEWAY_URL,
    provider: 'anthropic',
    tokenFactory
  });
  
  console.log('Switched to:', aiProviderInitService.getCurrentProviderType());
}

/**
 * Example 10: Migration Helper
 */
export async function migrationExample() {
  const { suggestGatewayMigration, isDeprecatedProvider } = await import('../ai-provider/providers/deprecated');
  
  // Old configuration
  const oldConfig = {
    type: 'openai',
    apiKey: 'sk-old-api-key',
    baseUrl: 'https://api.openai.com/v1'
  };
  
  if (isDeprecatedProvider(oldConfig)) {
    console.log('Configuration needs migration');
    const newConfig = suggestGatewayMigration(oldConfig);
    console.log('Suggested migration:', newConfig);
  }
}
