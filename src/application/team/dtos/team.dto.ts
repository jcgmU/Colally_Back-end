import { z } from 'zod';

// ============================================
// Input DTOs (with Zod validation)
// ============================================

export const CreateTeamInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name cannot be empty')
    .max(100, 'Team name must be 100 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
});

export type CreateTeamInput = z.infer<typeof CreateTeamInputSchema>;

export const UpdateTeamInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name cannot be empty')
    .max(100, 'Team name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
});

export type UpdateTeamInput = z.infer<typeof UpdateTeamInputSchema>;

export const ChangeMemberRoleInputSchema = z.object({
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export type ChangeMemberRoleInput = z.infer<typeof ChangeMemberRoleInputSchema>;

// ============================================
// Output DTOs
// ============================================

export interface TeamOutput {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamWithRoleOutput {
  team: TeamOutput;
  role: string;
}

export interface MemberOutput {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  role: string;
  joinedAt: Date;
}

export interface TeamDetailOutput {
  team: TeamOutput;
  role: string;
  memberCount: number;
}

export interface CreateTeamOutput {
  team: TeamOutput;
}

export interface GetTeamOutput {
  team: TeamOutput;
  role: string;
  memberCount: number;
}

export interface UpdateTeamOutput {
  team: TeamOutput;
}

export interface DeleteTeamOutput {
  success: boolean;
}

export interface GetMyTeamsOutput {
  teams: TeamWithRoleOutput[];
}

export interface GetTeamMembersOutput {
  members: MemberOutput[];
}

export interface ChangeMemberRoleOutput {
  member: MemberOutput;
}

export interface RemoveMemberOutput {
  success: boolean;
}

export interface LeaveTeamOutput {
  success: boolean;
}
