# users-teams Task Breakdown

## Overview

Implementación del módulo Users & Teams dividido en fases.

---

## Phase 1: Database Schema & Domain Foundation

### 1.1 Prisma Schema Update
- [ ] Agregar campo `avatarUrl` a User model
- [ ] Crear model Team
- [ ] Crear model TeamMembership
- [ ] Crear model TeamInvitation
- [ ] Generar y aplicar migración

### 1.2 Shared Domain
- [ ] Crear `src/domain/shared/value-objects/id.value-object.ts` (base class)
- [ ] Crear `TeamId`, `MembershipId`, `InvitationId` value objects

### 1.3 Team Domain - Value Objects
- [ ] `TeamName` value object (1-100 chars)
- [ ] `TeamRole` value object (owner, admin, member)
- [ ] `InvitationToken` value object (64 hex chars)
- [ ] `InvitationStatus` value object (pending, accepted, rejected, expired)
- [ ] `AvatarUrl` value object (optional https URL)

### 1.4 Team Domain - Errors
- [ ] Crear todos los domain errors en `team.errors.ts`

### 1.5 Team Domain - Entities
- [ ] `Team` entity con métodos create, reconstitute, update
- [ ] `TeamMembership` entity con permission checks
- [ ] `TeamInvitation` entity con lifecycle methods

### 1.6 Team Domain - Ports
- [ ] `ITeamRepository` interface
- [ ] `ITeamInvitationRepository` interface
- [ ] DI tokens

**Deliverable**: Domain layer completo, migración aplicada

---

## Phase 2: Repository Implementations

### 2.1 Extend User Repository
- [ ] Agregar método `updateProfile` a IUserRepository
- [ ] Implementar en PrismaUserRepository

### 2.2 Team Repository
- [ ] Crear `PrismaTeamRepository`
- [ ] Implementar CRUD de teams
- [ ] Implementar membership methods
- [ ] Implementar queries (findByUserId, getMemberships)

### 2.3 Team Invitation Repository
- [ ] Crear `PrismaTeamInvitationRepository`
- [ ] Implementar CRUD
- [ ] Implementar queries (findByToken, findPendingByEmail)

### 2.4 DI Configuration
- [ ] Registrar repositories en container

**Deliverable**: Infrastructure layer completo

---

## Phase 3: User Profile Use Cases

### 3.1 DTOs
- [ ] `UserProfileOutput` schema
- [ ] `UpdateProfileInput` schema (Zod validation)

### 3.2 Use Cases
- [ ] `GetMyProfileUseCase`
- [ ] `UpdateMyProfileUseCase`

**Deliverable**: User profile functionality

---

## Phase 4: Team CRUD Use Cases

### 4.1 DTOs
- [ ] `TeamOutput` schema
- [ ] `CreateTeamInput` schema
- [ ] `UpdateTeamInput` schema

### 4.2 Use Cases
- [ ] `CreateTeamUseCase` (creates team + owner membership)
- [ ] `GetTeamUseCase` (with permission check)
- [ ] `GetMyTeamsUseCase`
- [ ] `UpdateTeamUseCase` (owner/admin only)
- [ ] `DeleteTeamUseCase` (owner only)

**Deliverable**: Team CRUD functionality

---

## Phase 5: Membership Use Cases

### 5.1 DTOs
- [ ] `MemberOutput` schema
- [ ] `UpdateMemberRoleInput` schema

### 5.2 Use Cases
- [ ] `GetTeamMembersUseCase`
- [ ] `UpdateMemberRoleUseCase` (with ownership transfer logic)
- [ ] `RemoveMemberUseCase` (with permission matrix)
- [ ] `LeaveTeamUseCase` (owner cannot leave)

**Deliverable**: Membership management

---

## Phase 6: Invitation Use Cases

### 6.1 DTOs
- [ ] `InvitationOutput` schema
- [ ] `InviteToTeamInput` schema

### 6.2 Use Cases
- [ ] `InviteToTeamUseCase` (with role permission check)
- [ ] `GetMyInvitationsUseCase`
- [ ] `AcceptInvitationUseCase` (with email validation)
- [ ] `RejectInvitationUseCase`
- [ ] `CancelInvitationUseCase`

**Deliverable**: Invitation system completo

---

## Phase 7: GraphQL Layer

### 7.1 Schema Files
- [ ] Crear `user.graphql` (profile types, queries, mutations)
- [ ] Crear `team.graphql` (team types, enums, queries, mutations)
- [ ] Integrar schemas en schema builder

### 7.2 Resolvers
- [ ] `UserResolvers` (myProfile, updateProfile)
- [ ] `TeamResolvers` (all team queries and mutations)

### 7.3 Field Resolvers
- [ ] Team.memberCount resolver
- [ ] Team.myRole resolver
- [ ] TeamInvitation.team resolver
- [ ] TeamInvitation.invitedBy resolver

**Deliverable**: GraphQL API completa

---

## Phase 8: Unit & Integration Tests

### 8.1 Domain Tests
- [ ] Value object tests (TeamName, TeamRole, InvitationToken, etc.)
- [ ] Entity tests (Team, TeamMembership, TeamInvitation)

### 8.2 Use Case Tests
- [ ] User profile use case tests
- [ ] Team CRUD use case tests
- [ ] Membership use case tests
- [ ] Invitation use case tests

### 8.3 Repository Tests
- [ ] PrismaTeamRepository integration tests
- [ ] PrismaTeamInvitationRepository integration tests

**Deliverable**: Test coverage para domain y application layers

---

## Phase 9: E2E Tests

### 9.1 User Profile E2E
- [ ] myProfile query tests
- [ ] updateProfile mutation tests

### 9.2 Team E2E
- [ ] Team CRUD tests
- [ ] Permission denied scenarios

### 9.3 Membership E2E
- [ ] Member management tests
- [ ] Ownership transfer test
- [ ] Leave team tests

### 9.4 Invitation E2E
- [ ] Full invitation lifecycle test
- [ ] Expired invitation test
- [ ] Permission tests

**Deliverable**: E2E test coverage

---

## Summary

| Phase | Description | Estimated Effort |
|-------|-------------|------------------|
| 1 | Database & Domain Foundation | Medium |
| 2 | Repository Implementations | Medium |
| 3 | User Profile Use Cases | Small |
| 4 | Team CRUD Use Cases | Medium |
| 5 | Membership Use Cases | Medium |
| 6 | Invitation Use Cases | Medium |
| 7 | GraphQL Layer | Medium |
| 8 | Unit & Integration Tests | Large |
| 9 | E2E Tests | Medium |

**Total estimated phases**: 9
**Estimated sessions**: 3-4 coding sessions

---

## Current Status

- [ ] **Phase 1**: Pending
- [ ] **Phase 2**: Pending
- [ ] **Phase 3**: Pending
- [ ] **Phase 4**: Pending
- [ ] **Phase 5**: Pending
- [ ] **Phase 6**: Pending
- [ ] **Phase 7**: Pending
- [ ] **Phase 8**: Pending
- [ ] **Phase 9**: Pending
