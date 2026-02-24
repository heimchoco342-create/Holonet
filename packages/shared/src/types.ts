export type ItemType = 'FOLDER' | 'REQUEST';
export type Protocol = 'HTTP' | 'WebSocket' | 'gRPC';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type WebSocketMessageType = 'text' | 'json' | 'binary';

export interface Workspace {
  id: string;
  name: string;
  items: Item[];
  environments: Environment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  workspaceId: string;
  parentId: string | null;
  type: ItemType;
  name: string;
  sortOrder: number;
  protocol?: Protocol; // HTTP, WebSocket, gRPC
  method?: HttpMethod; // HTTP method
  url?: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  // WebSocket specific
  wsMessages?: WebSocketMessage[]; // Message history
  wsConnected?: boolean;
  // gRPC specific
  grpcService?: string; // Service name
  grpcMethod?: string; // Method name
  grpcProto?: string; // Proto file content or path
  grpcMetadata?: Record<string, any>; // gRPC metadata
  // K8s Tunnel
  k8sService?: string;
  k8sNamespace?: string;
  k8sPort?: number;
  testScript?: string; // JavaScript test script
  testResults?: TestResult; // Last test execution results
  children?: Item[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebSocketMessage {
  id: string;
  type: WebSocketMessageType;
  content: string;
  timestamp: Date;
  direction: 'sent' | 'received';
}

export interface TestResult {
  passed: boolean;
  assertions: TestAssertion[];
  executionTime: number;
  timestamp: Date;
}

export interface TestAssertion {
  name: string;
  passed: boolean;
  error?: string;
}

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface K8sTunnelConfig {
  service: string;
  namespace: string;
  port: number;
}
