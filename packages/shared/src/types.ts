export type ItemType = 'FOLDER' | 'REQUEST';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

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
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  k8sService?: string;
  k8sNamespace?: string;
  k8sPort?: number;
  testScript?: string; // JavaScript test script
  testResults?: TestResult; // Last test execution results
  children?: Item[];
  createdAt: Date;
  updatedAt: Date;
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
