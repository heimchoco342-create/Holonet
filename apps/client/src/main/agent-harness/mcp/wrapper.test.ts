import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpToolWrapper } from './wrapper';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Mock the Client class
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      callTool: vi.fn()
    }))
  };
});

describe('McpToolWrapper', () => {
  let mockClient: Client;
  let mockTool: Tool;
  let wrapper: McpToolWrapper;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock client
    mockClient = new Client({
        name: "test-client",
        version: "1.0.0"
    }, {
        transport: {
            start: vi.fn(),
            close: vi.fn(),
            send: vi.fn(),
            onmessage: undefined as any,
            onclose: undefined as any,
            onerror: undefined as any,
        }
    });

    // Setup mock tool definition
    mockTool = {
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: {
        type: 'object',
        properties: {
          arg1: { type: 'string' }
        }
      }
    };
    
    // Create wrapper instance
    wrapper = new McpToolWrapper(mockClient, mockTool);
  });

  it('should initialize with correct properties', () => {
    expect(wrapper.name).toBe('test-tool');
    expect(wrapper.description).toBe('A test tool');
    // Schema is a Zod object, we can't easily deep equal it, but we can check it exists
    expect(wrapper.schema).toBeDefined();
  });

  it('should call the MCP client with correct arguments', async () => {
    const args = { arg1: 'value1' };
    const mockResult: CallToolResult = {
      content: [{ type: 'text', text: 'Success' }],
      isError: false
    };

    // Mock the callTool method
    mockClient.callTool = vi.fn().mockResolvedValue(mockResult);

    const result = await wrapper.invoke(args);

    expect(mockClient.callTool).toHaveBeenCalledWith({
      name: 'test-tool',
      arguments: args
    });
    expect(result).toBe('Success');
  });

  it('should handle tool execution errors', async () => {
    const args = { arg1: 'bad' };
    const mockResult: CallToolResult = {
      content: [{ type: 'text', text: 'Something went wrong' }],
      isError: true
    };

    mockClient.callTool = vi.fn().mockResolvedValue(mockResult);

    await expect(wrapper.invoke(args)).rejects.toThrow('MCP Tool Error');
  });

  it('should handle client exceptions', async () => {
     mockClient.callTool = vi.fn().mockRejectedValue(new Error('Network error'));
     
     await expect(wrapper.invoke({})).rejects.toThrow("Failed to call MCP tool 'test-tool': Network error");
  });

  it('should format multiple content items correctly', async () => {
    const mockResult: CallToolResult = {
        content: [
            { type: 'text', text: 'Part 1' },
            { type: 'text', text: 'Part 2' }
        ],
        isError: false
    };
    
    mockClient.callTool = vi.fn().mockResolvedValue(mockResult);
    
    const result = await wrapper.invoke({});
    expect(result).toBe('Part 1\nPart 2');
  });
});
