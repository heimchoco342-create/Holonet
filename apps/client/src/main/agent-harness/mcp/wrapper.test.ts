import { describe, it, expect, vi } from 'vitest';
import { McpToolWrapper } from './wrapper';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

describe('McpToolWrapper', () => {
  it('should wrap an MCP tool and call it successfully', async () => {
    // Mock the MCP Client
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Result from tool' }],
        isError: false,
      } as CallToolResult),
    } as unknown as Client;

    const toolDefinition: Tool = {
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} },
    };

    const wrapper = new McpToolWrapper(mockClient, toolDefinition);

    expect(wrapper.name).toBe('test-tool');
    expect(wrapper.description).toBe('A test tool');

    const result = await wrapper.invoke({ some: 'arg' });

    expect(mockClient.callTool).toHaveBeenCalledWith({
      name: 'test-tool',
      arguments: { some: 'arg' },
    });
    expect(result).toBe('Result from tool');
  });

  it('should handle tool errors', async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Error message' }],
        isError: true,
      } as CallToolResult),
    } as unknown as Client;

    const toolDefinition: Tool = {
      name: 'error-tool',
      description: 'A tool that errors',
      inputSchema: { type: 'object', properties: {} },
    };

    const wrapper = new McpToolWrapper(mockClient, toolDefinition);

    await expect(wrapper.invoke({})).rejects.toThrow('MCP Tool Error');
  });
});
