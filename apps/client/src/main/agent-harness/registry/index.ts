import { z } from 'zod';

export interface Skill<T = any, R = any> {
  name: string;
  description: string;
  schema: z.ZodType<T>;
  execute: (input: T) => Promise<R>;
}

export class AgentSkillRegistry {
  private skills: Map<string, Skill> = new Map();

  register<T, R>(skill: Skill<T, R>): void {
    if (this.skills.has(skill.name)) {
      throw new Error(`Skill with name "${skill.name}" is already registered.`);
    }
    this.skills.set(skill.name, skill);
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  has(name: string): boolean {
    return this.skills.has(name);
  }

  clear(): void {
    this.skills.clear();
  }
}
