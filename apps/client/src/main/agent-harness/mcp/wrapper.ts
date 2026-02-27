import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Wraps an MCP tool as a LangChain StructuredTool.
 */
export class McpToolWrapper extends StructuredTool {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  
  private client: Client;
  private toolName: string;

  constructor(client: Client, tool: Tool) {
    super();
    this.client = client;
    this.toolName = tool.name;
    this.name = tool.name;
    this.description = tool.description || `MCP Tool: ${tool.name}`;
    
    // We use a passthrough schema to allow any input that matches the tool's definition.
    // In a production environment, you might want to convert the JSON schema to Zod.
    this.schema = z.object({}).passthrough();
  }

  /**
   * Calls the MCP tool.
   */
  async _call(arg: any): Promise<string> {
    try {
      const result: CallToolResult = await this.client.callTool({
        name: this.toolName,
        arguments: arg,
      });

      if (result.isError) {
        throw new Error(`MCP Tool Error: ${JSON.stringify(result.content)}`);
      }

      // Convert the content to a string format expected by LangChain
      return result.content
        .map((item) => {
          if (item.type === "text") {
            return item.text;
          } else if (item.type === "image") {
            return `[Image: ${item.mimeType}]`;
          } else if (item.type === "resource") {
             return `[Resource: ${item.resource.uri}]`;
          }
          return JSON.stringify(item);
        })
        .join("\n");
    } catch (error: any) {
      throw new Error(`Failed to call MCP tool '${this.name}': ${error.message}`);
    }
  }
}
