import { z } from 'zod';

import { Project } from '@domain/project/index.js';

// ============================================
// Input DTOs (with Zod validation)
// ============================================

export const CreateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must be 100 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullish(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const UpdateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullish(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

export const ReorderProjectsInputSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1),
});

export type ReorderProjectsInput = z.infer<typeof ReorderProjectsInputSchema>;

// ============================================
// Output DTOs
// ============================================

export interface ProjectDTO {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  position: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Mapper
// ============================================

export function toProjectDTO(project: Project): ProjectDTO {
  return {
    id: project.id.value,
    teamId: project.teamId.value,
    name: project.name.value,
    description: project.description,
    status: project.status.value as 'active' | 'archived',
    position: project.position,
    createdBy: project.createdBy.value,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
