# users-teams Technical Design

## Overview

Diseño técnico para el módulo Users & Teams siguiendo Clean Architecture.

---

## 1. Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GraphQL Resolvers (user.resolvers.ts, team.resolvers.ts) │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  Use Cases:                                                 ││
│  │  - GetMyProfile, UpdateMyProfile                           ││
│  │  - CreateTeam, GetTeam, UpdateTeam, DeleteTeam, GetMyTeams ││
│  │  - GetTeamMembers, UpdateMemberRole, RemoveMember, LeaveTeam│
│  │  - InviteToTeam, AcceptInvitation, RejectInvitation, etc.  ││
│  └────────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────────┐│
│  │  DTOs: Input/Output schemas with Zod validation            ││
│  └────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ User Profile │  │    Team      │  │  TeamMembership     │   │
│  │   Entity     │  │   Entity     │  │     Entity          │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TeamInvitation Entity                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Value Objects: TeamName, TeamRole, InvitationToken,     │  │
│  │                 AvatarUrl, InvitationStatus              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Ports: ITeamRepository, ITeamInvitationRepository       │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Prisma Repositories: PrismaTeamRepository,              │  │
│  │                       PrismaTeamInvitationRepository     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain Design

### 2.1 Entities

#### Team Entity
```typescript
// src/domain/team/entities/team.entity.ts
export class Team {
  private constructor(
    public readonly id: TeamId,
    public readonly name: TeamName,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public static create(props: CreateTeamProps): Team { }
  public static reconstitute(props: ReconstituteTeamProps): Team { }
  
  public updateName(name: TeamName): Team { }
  public updateDescription(description: string | null): Team { }
}
```

#### TeamMembership Entity
```typescript
// src/domain/team/entities/team-membership.entity.ts
export class TeamMembership {
  private constructor(
    public readonly id: MembershipId,
    public readonly userId: UserId,
    public readonly teamId: TeamId,
    public readonly role: TeamRole,
    public readonly joinedAt: Date
  ) {}

  public static create(props: CreateMembershipProps): TeamMembership { }
  public static reconstitute(props: ReconstituteMembershipProps): TeamMembership { }
  
  public isOwner(): boolean { }
  public isAdmin(): boolean { }
  public canManageMembers(): boolean { }  // owner or admin
  public canModifyTeam(): boolean { }     // owner or admin
  public canDeleteTeam(): boolean { }     // owner only
  public canInviteAs(role: TeamRole): boolean { }
  
  public changeRole(newRole: TeamRole): TeamMembership { }
}
```

#### TeamInvitation Entity
```typescript
// src/domain/team/entities/team-invitation.entity.ts
export class TeamInvitation {
  private constructor(
    public readonly id: InvitationId,
    public readonly teamId: TeamId,
    public readonly email: Email,
    public readonly role: TeamRole,
    public readonly token: InvitationToken,
    public readonly invitedBy: UserId,
    public readonly expiresAt: Date,
    public readonly status: InvitationStatus,
    public readonly createdAt: Date
  ) {}

  public static create(props: CreateInvitationProps): TeamInvitation { }
  public static reconstitute(props: ReconstituteInvitationProps): TeamInvitation { }
  
  public isExpired(): boolean { }
  public isPending(): boolean { }
  public canBeAcceptedBy(email: Email): boolean { }
  
  public accept(): TeamInvitation { }
  public reject(): TeamInvitation { }
  public markExpired(): TeamInvitation { }
}
```

### 2.2 Value Objects

```typescript
// src/domain/team/value-objects/

// TeamName: 1-100 chars
export class TeamName {
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 100;
  public static create(value: string): TeamName { }
}

// TeamRole: owner | admin | member
export class TeamRole {
  public static readonly OWNER = new TeamRole('owner');
  public static readonly ADMIN = new TeamRole('admin');
  public static readonly MEMBER = new TeamRole('member');
  
  public isOwner(): boolean { }
  public isAtLeast(role: TeamRole): boolean { }  // hierarchy check
}

// InvitationToken: 64 hex chars (crypto.randomBytes(32))
export class InvitationToken {
  public static generate(): InvitationToken { }
  public static create(value: string): InvitationToken { }
}

// InvitationStatus: pending | accepted | rejected | expired
export class InvitationStatus {
  public static readonly PENDING = new InvitationStatus('pending');
  public static readonly ACCEPTED = new InvitationStatus('accepted');
  public static readonly REJECTED = new InvitationStatus('rejected');
  public static readonly EXPIRED = new InvitationStatus('expired');
}

// AvatarUrl: optional, must be valid https URL
export class AvatarUrl {
  public static create(value: string | null): AvatarUrl | null { }
}
```

### 2.3 Domain Errors

```typescript
// src/domain/team/errors/team.errors.ts
export class TeamNotFoundError extends DomainError { }
export class TeamNameInvalidError extends DomainError { }
export class InsufficientPermissionError extends DomainError { }
export class AlreadyMemberError extends DomainError { }
export class NotMemberError extends DomainError { }
export class CannotRemoveOwnerError extends DomainError { }
export class OwnerCannotLeaveError extends DomainError { }
export class InvitationNotFoundError extends DomainError { }
export class InvitationExpiredError extends DomainError { }
export class InvitationAlreadyExistsError extends DomainError { }
export class InvitationEmailMismatchError extends DomainError { }
export class MustTransferOwnershipError extends DomainError { }
```

---

## 3. Ports (Interfaces)

### 3.1 ITeamRepository

```typescript
// src/domain/team/ports/team-repository.port.ts
export interface ITeamRepository {
  // Team CRUD
  create(team: Team, ownerId: UserId): Promise<Team>;
  findById(id: TeamId): Promise<Team | null>;
  findByIdWithMembership(id: TeamId, userId: UserId): Promise<TeamWithMembership | null>;
  update(team: Team): Promise<Team>;
  delete(id: TeamId): Promise<void>;
  
  // User's teams
  findByUserId(userId: UserId): Promise<TeamWithRole[]>;
  
  // Memberships
  getMemberships(teamId: TeamId): Promise<MembershipWithUser[]>;
  getMembership(teamId: TeamId, userId: UserId): Promise<TeamMembership | null>;
  addMembership(membership: TeamMembership): Promise<TeamMembership>;
  updateMembership(membership: TeamMembership): Promise<TeamMembership>;
  removeMembership(teamId: TeamId, userId: UserId): Promise<void>;
  countMembers(teamId: TeamId): Promise<number>;
  
  // Check if user is member
  isMember(teamId: TeamId, userId: UserId): Promise<boolean>;
}
```

### 3.2 ITeamInvitationRepository

```typescript
// src/domain/team/ports/team-invitation-repository.port.ts
export interface ITeamInvitationRepository {
  create(invitation: TeamInvitation): Promise<TeamInvitation>;
  findById(id: InvitationId): Promise<TeamInvitation | null>;
  findByToken(token: InvitationToken): Promise<TeamInvitation | null>;
  findPendingByEmail(email: Email): Promise<TeamInvitation[]>;
  findPendingByTeamAndEmail(teamId: TeamId, email: Email): Promise<TeamInvitation | null>;
  findByTeam(teamId: TeamId): Promise<TeamInvitation[]>;
  update(invitation: TeamInvitation): Promise<TeamInvitation>;
  delete(id: InvitationId): Promise<void>;
}
```

---

## 4. Application Layer (Use Cases)

### 4.1 User Profile Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| GetMyProfile | userId (from context) | UserProfileOutput |
| UpdateMyProfile | name?, avatarUrl? | UserProfileOutput |

### 4.2 Team Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| CreateTeam | name, description? | TeamOutput |
| GetTeam | teamId | TeamOutput |
| GetMyTeams | userId (from context) | TeamWithRole[] |
| UpdateTeam | teamId, name?, description? | TeamOutput |
| DeleteTeam | teamId | void |

### 4.3 Membership Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| GetTeamMembers | teamId | MemberOutput[] |
| UpdateMemberRole | teamId, targetUserId, newRole | MemberOutput |
| RemoveMember | teamId, targetUserId | void |
| LeaveTeam | teamId | void |

### 4.4 Invitation Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| InviteToTeam | teamId, email, role | InvitationOutput |
| GetMyInvitations | email (from context) | InvitationOutput[] |
| AcceptInvitation | token | TeamOutput |
| RejectInvitation | token | void |
| CancelInvitation | invitationId | void |

---

## 5. Database Schema

```prisma
// Extend User model
model User {
  // ... existing fields ...
  avatarUrl String? @map("avatar_url") @db.VarChar(500)
  
  memberships      TeamMembership[]
  sentInvitations  TeamInvitation[] @relation("InvitedBy")
}

model Team {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  
  memberships TeamMembership[]
  invitations TeamInvitation[]
  
  @@map("teams")
}

model TeamMembership {
  id       String   @id @default(uuid()) @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  teamId   String   @map("team_id") @db.Uuid
  role     String   @db.VarChar(20)
  joinedAt DateTime @default(now()) @map("joined_at") @db.Timestamptz
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  @@unique([userId, teamId])
  @@index([teamId])
  @@map("team_memberships")
}

model TeamInvitation {
  id        String   @id @default(uuid()) @db.Uuid
  teamId    String   @map("team_id") @db.Uuid
  email     String   @db.VarChar(255)
  role      String   @db.VarChar(20)
  token     String   @unique @db.VarChar(64)
  invitedBy String   @map("invited_by") @db.Uuid
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  status    String   @default("pending") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  
  team    Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  inviter User @relation("InvitedBy", fields: [invitedBy], references: [id])
  
  @@index([email])
  @@index([token])
  @@index([teamId])
  @@map("team_invitations")
}
```

---

## 6. GraphQL Schema

```graphql
# Types
type UserProfile {
  id: ID!
  email: String!
  name: String!
  avatarUrl: String
  createdAt: DateTime!
}

type Team {
  id: ID!
  name: String!
  description: String
  memberCount: Int!
  myRole: TeamRole
  createdAt: DateTime!
  updatedAt: DateTime!
}

type TeamMember {
  id: ID!
  user: UserProfile!
  role: TeamRole!
  joinedAt: DateTime!
}

type TeamInvitation {
  id: ID!
  team: Team!
  email: String!
  role: TeamRole!
  invitedBy: UserProfile!
  expiresAt: DateTime!
  status: InvitationStatus!
  createdAt: DateTime!
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

# Inputs
input UpdateProfileInput {
  name: String
  avatarUrl: String
}

input CreateTeamInput {
  name: String!
  description: String
}

input UpdateTeamInput {
  name: String
  description: String
}

input InviteToTeamInput {
  teamId: ID!
  email: String!
  role: TeamRole!
}

# Queries
extend type Query {
  myProfile: UserProfile
  team(id: ID!): Team
  myTeams: [Team!]!
  teamMembers(teamId: ID!): [TeamMember!]!
  myInvitations: [TeamInvitation!]!
}

# Mutations
extend type Mutation {
  updateProfile(input: UpdateProfileInput!): UserProfile!
  
  createTeam(input: CreateTeamInput!): Team!
  updateTeam(id: ID!, input: UpdateTeamInput!): Team!
  deleteTeam(id: ID!): Boolean!
  
  updateMemberRole(teamId: ID!, userId: ID!, role: TeamRole!): TeamMember!
  removeMember(teamId: ID!, userId: ID!): Boolean!
  leaveTeam(teamId: ID!): Boolean!
  
  inviteToTeam(input: InviteToTeamInput!): TeamInvitation!
  acceptInvitation(token: String!): Team!
  rejectInvitation(token: String!): Boolean!
  cancelInvitation(id: ID!): Boolean!
}
```

---

## 7. Sequence Diagrams

### 7.1 Create Team Flow

```
User          Resolver        CreateTeamUseCase    TeamRepository
  │               │                   │                   │
  │──createTeam──►│                   │                   │
  │               │──execute─────────►│                   │
  │               │                   │──create──────────►│
  │               │                   │   (team + owner   │
  │               │                   │    membership)    │
  │               │                   │◄─────────────────┤
  │               │◄──────────────────┤                   │
  │◄──────────────┤                   │                   │
```

### 7.2 Accept Invitation Flow

```
User      Resolver    AcceptInvitationUC   InvitationRepo   TeamRepo
  │          │               │                  │              │
  │─accept──►│               │                  │              │
  │          │──execute─────►│                  │              │
  │          │               │──findByToken────►│              │
  │          │               │◄─────────────────┤              │
  │          │               │  (validate email, expiry)       │
  │          │               │──addMembership─────────────────►│
  │          │               │◄────────────────────────────────┤
  │          │               │──update(accepted)──►│           │
  │          │               │◄────────────────────┤           │
  │          │◄──────────────┤                     │           │
  │◄─────────┤               │                     │           │
```

---

## 8. File Structure

```
src/
├── domain/
│   ├── auth/                          # Existing
│   ├── shared/                        # Shared value objects
│   │   └── value-objects/
│   │       └── id.value-object.ts     # Base ID class
│   └── team/
│       ├── entities/
│       │   ├── team.entity.ts
│       │   ├── team-membership.entity.ts
│       │   └── team-invitation.entity.ts
│       ├── value-objects/
│       │   ├── team-id.value-object.ts
│       │   ├── team-name.value-object.ts
│       │   ├── team-role.value-object.ts
│       │   ├── invitation-token.value-object.ts
│       │   ├── invitation-status.value-object.ts
│       │   └── avatar-url.value-object.ts
│       ├── errors/
│       │   └── team.errors.ts
│       └── ports/
│           ├── team-repository.port.ts
│           ├── team-invitation-repository.port.ts
│           └── index.ts
│
├── application/
│   ├── auth/                          # Existing
│   ├── user/
│   │   ├── use-cases/
│   │   │   ├── get-my-profile.use-case.ts
│   │   │   └── update-my-profile.use-case.ts
│   │   └── dtos/
│   │       └── user-profile.dto.ts
│   └── team/
│       ├── use-cases/
│       │   ├── create-team.use-case.ts
│       │   ├── get-team.use-case.ts
│       │   ├── get-my-teams.use-case.ts
│       │   ├── update-team.use-case.ts
│       │   ├── delete-team.use-case.ts
│       │   ├── get-team-members.use-case.ts
│       │   ├── update-member-role.use-case.ts
│       │   ├── remove-member.use-case.ts
│       │   ├── leave-team.use-case.ts
│       │   ├── invite-to-team.use-case.ts
│       │   ├── get-my-invitations.use-case.ts
│       │   ├── accept-invitation.use-case.ts
│       │   ├── reject-invitation.use-case.ts
│       │   └── cancel-invitation.use-case.ts
│       └── dtos/
│           ├── team.dto.ts
│           ├── membership.dto.ts
│           └── invitation.dto.ts
│
├── adapters/
│   └── repositories/
│       ├── prisma-user.repository.ts  # Extend for avatar
│       ├── prisma-team.repository.ts
│       └── prisma-team-invitation.repository.ts
│
└── presentation/
    └── graphql/
        ├── resolvers/
        │   ├── user.resolvers.ts
        │   └── team.resolvers.ts
        └── schema/
            ├── user.graphql
            └── team.graphql
```

---

## 9. DI Container Configuration

```typescript
// src/config/container.ts (additions)

// Team Repository
container.register<ITeamRepository>(
  TEAM_REPOSITORY_TOKEN,
  { useClass: PrismaTeamRepository }
);

// Team Invitation Repository
container.register<ITeamInvitationRepository>(
  TEAM_INVITATION_REPOSITORY_TOKEN,
  { useClass: PrismaTeamInvitationRepository }
);
```

---

## 10. Testing Strategy

| Layer | Test Type | Coverage Target |
|-------|-----------|-----------------|
| Domain entities | Unit | 100% |
| Value objects | Unit | 100% |
| Use cases | Integration (mocked repos) | 100% |
| Repositories | Integration (real DB) | Key scenarios |
| Resolvers | E2E | All mutations/queries |

### Key Test Scenarios

1. **Permission tests**: Verify each role can/cannot perform actions
2. **Ownership transfer**: Ensure atomic role swap
3. **Invitation flow**: Full lifecycle from invite to accept
4. **Edge cases**: Last owner, expired invitations, duplicate invites
