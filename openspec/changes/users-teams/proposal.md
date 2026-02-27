# users-teams

## Change Proposal

**Change Name**: users-teams
**Created**: 2026-02-27
**Status**: draft

---

## Intent

Implementar el módulo de Users y Teams que permita:
1. Gestión de perfiles de usuario (ver, actualizar perfil propio)
2. Creación y gestión de equipos (Teams)
3. Sistema de membresías con roles (owner, admin, member)
4. Invitaciones a equipos

Este módulo es el siguiente paso después de auth-foundation, permitiendo a los usuarios organizarse en equipos antes de crear proyectos.

---

## Scope

### In Scope
- **User Profile**: Ver y actualizar perfil propio (nombre, avatar URL)
- **Teams CRUD**: Crear, leer, actualizar, eliminar equipos
- **Team Memberships**: Agregar/remover miembros, cambiar roles
- **Team Invitations**: Invitar usuarios por email, aceptar/rechazar invitaciones
- **Roles**: Owner (creador), Admin (gestión), Member (participante)

### Out of Scope
- Notificaciones por email (se hará en feature posterior)
- Upload de avatares (solo URL por ahora)
- Teams públicos/privados (todos serán privados)
- Permisos granulares más allá de roles básicos

---

## Approach

### Domain Design
```
src/domain/
├── user/                    # Extender User existente
│   ├── entities/
│   │   └── user-profile.entity.ts
│   └── value-objects/
│       └── avatar-url.value-object.ts
│
└── team/                    # Nuevo módulo
    ├── entities/
    │   ├── team.entity.ts
    │   ├── team-membership.entity.ts
    │   └── team-invitation.entity.ts
    ├── value-objects/
    │   ├── team-name.value-object.ts
    │   ├── team-role.value-object.ts
    │   └── invitation-token.value-object.ts
    ├── errors/
    │   └── team.errors.ts
    └── ports/
        ├── team-repository.port.ts
        └── team-invitation-repository.port.ts
```

### Database Schema (Prisma)
```prisma
model Team {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  memberships TeamMembership[]
  invitations TeamInvitation[]
  
  @@map("teams")
}

model TeamMembership {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  teamId    String   @map("team_id") @db.Uuid
  role      String   @db.VarChar(20) // owner, admin, member
  joinedAt  DateTime @default(now()) @map("joined_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  @@unique([userId, teamId])
  @@map("team_memberships")
}

model TeamInvitation {
  id        String   @id @default(uuid()) @db.Uuid
  teamId    String   @map("team_id") @db.Uuid
  email     String   @db.VarChar(255)
  role      String   @db.VarChar(20) // admin, member
  token     String   @unique @db.VarChar(64)
  invitedBy String   @map("invited_by") @db.Uuid
  expiresAt DateTime @map("expires_at")
  status    String   @default("pending") @db.VarChar(20) // pending, accepted, rejected, expired
  createdAt DateTime @default(now()) @map("created_at")
  
  team    Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  inviter User @relation(fields: [invitedBy], references: [id])
  
  @@index([email])
  @@index([token])
  @@map("team_invitations")
}
```

### GraphQL API
```graphql
# Queries
type Query {
  me: User                           # Ya existe
  myProfile: UserProfile
  team(id: ID!): Team
  myTeams: [Team!]!
  teamMembers(teamId: ID!): [TeamMember!]!
  myInvitations: [TeamInvitation!]!
}

# Mutations
type Mutation {
  # User Profile
  updateProfile(input: UpdateProfileInput!): UserProfile!
  
  # Teams
  createTeam(input: CreateTeamInput!): Team!
  updateTeam(id: ID!, input: UpdateTeamInput!): Team!
  deleteTeam(id: ID!): Boolean!
  
  # Memberships
  removeMember(teamId: ID!, userId: ID!): Boolean!
  updateMemberRole(teamId: ID!, userId: ID!, role: TeamRole!): TeamMember!
  leaveTeam(teamId: ID!): Boolean!
  
  # Invitations
  inviteToTeam(input: InviteToTeamInput!): TeamInvitation!
  acceptInvitation(token: String!): Team!
  rejectInvitation(token: String!): Boolean!
  cancelInvitation(id: ID!): Boolean!
}
```

---

## Risks

| Risk | Mitigation |
|------|------------|
| Complejidad de permisos | Empezar con 3 roles simples (owner/admin/member) |
| Race conditions en invitaciones | Usar transacciones de Prisma |
| Owner abandona equipo | Owner no puede salir sin transferir ownership |

---

## Rollback Plan

1. Revertir migraciones de Prisma (`prisma migrate reset`)
2. Eliminar archivos del módulo team
3. Revertir cambios en User entity

---

## Dependencies

- **auth-foundation**: Requiere autenticación JWT funcionando ✅
- **Prisma migrations**: Nuevas tablas para teams

---

## Estimated Effort

- **Phases**: 6-8 phases
- **Estimated time**: 3-4 sessions de desarrollo
