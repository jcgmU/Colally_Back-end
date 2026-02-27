import { z } from 'zod';

// ============================================
// Input DTOs (with Zod validation)
// ============================================

export const CreateInvitationInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationInputSchema>;

// ============================================
// Output DTOs
// ============================================

export interface InvitationOutput {
  id: string;
  teamId: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string;
  inviterName?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface InvitationWithTeamOutput {
  invitation: InvitationOutput;
  teamName: string;
  inviterName: string;
}

export interface CreateInvitationOutput {
  invitation: InvitationOutput;
}

export interface GetTeamInvitationsOutput {
  invitations: InvitationOutput[];
}

export interface GetMyInvitationsOutput {
  invitations: InvitationWithTeamOutput[];
}

export interface AcceptInvitationOutput {
  teamId: string;
  teamName: string;
  role: string;
}

export interface RejectInvitationOutput {
  success: boolean;
}

export interface CancelInvitationOutput {
  success: boolean;
}
