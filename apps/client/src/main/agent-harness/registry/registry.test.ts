import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { AgentSkillRegistry, Skill } from './index';

describe('AgentSkillRegistry', () => {
  let registry: AgentSkillRegistry;

  beforeEach(() => {
    registry = new AgentSkillRegistry();
  });

  const mockSkill: Skill = {
    name: 'test-skill',
    description: 'A test skill',
    schema: z.object({ value: z.string() }),
    execute: async (input: { value: string }) => {
      return `Processed: ${input.value}`;
    },
  };

  it('should register a skill', () => {
    registry.register(mockSkill);
    expect(registry.get('test-skill')).toBe(mockSkill);
  });

  it('should list registered skills', () => {
    registry.register(mockSkill);
    const skills = registry.list();
    expect(skills).toHaveLength(1);
    expect(skills[0]).toBe(mockSkill);
  });

  it('should prevent registering duplicate skills', () => {
    registry.register(mockSkill);
    expect(() => registry.register(mockSkill)).toThrowError(
      'Skill with name "test-skill" is already registered.'
    );
  });

  it('should return undefined for non-existent skill', () => {
    expect(registry.get('non-existent')).toBeUndefined();
  });

  it('should check if skill exists', () => {
    registry.register(mockSkill);
    expect(registry.has('test-skill')).toBe(true);
    expect(registry.has('other-skill')).toBe(false);
  });

  it('should clear all skills', () => {
    registry.register(mockSkill);
    registry.clear();
    expect(registry.list()).toHaveLength(0);
  });
});
