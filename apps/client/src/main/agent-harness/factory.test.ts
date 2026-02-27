import { describe, it, expect } from 'vitest';
import { createDeepAgent, DeepAgentConfig, AgentStateSchema } from './factory';

describe('createDeepAgent', () => {
  it('should create a valid StateGraph instance', () => {
    const config: DeepAgentConfig = {
      name: 'Test Agent',
      model: 'gpt-4-turbo',
      systemPrompt: 'You are a helpful assistant.',
    };

    const agent = createDeepAgent(config);
    expect(agent).toBeDefined();
    // Verify it has methods typical of a compiled graph
    expect(typeof agent.invoke).toBe('function');
  });

  it('should expose a valid Zod schema for state', () => {
    const validState = {
      messages: [],
      context: {},
      intermediateSteps: []
    };
    
    const parseResult = AgentStateSchema.safeParse(validState);
    expect(parseResult.success).toBe(true);
  });

  it('should compile successfully with default channels', () => {
     const config: DeepAgentConfig = {
      name: 'Compile Test Agent',
      model: 'gpt-3.5-turbo',
    };
    const agent = createDeepAgent(config);
    // If it compiles, createDeepAgent returns the compiled graph directly
    expect(agent).not.toBeNull();
  });
});
