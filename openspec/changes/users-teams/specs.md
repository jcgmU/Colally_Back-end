# users-teams Specifications

## Overview

Este documento define las especificaciones para el módulo Users & Teams.

---

## 1. User Profile

### 1.1 Get My Profile

**Scenario: Usuario autenticado obtiene su perfil**
- **Given** un usuario autenticado con id "user-1"
- **When** solicita su perfil
- **Then** DEBE recibir id, email, name, avatarUrl, createdAt
- **And** NO DEBE recibir password ni tokens

**Scenario: Usuario no autenticado intenta obtener perfil**
- **Given** un usuario sin token de autenticación
- **When** solicita su perfil
- **Then** DEBE recibir error UNAUTHENTICATED

### 1.2 Update My Profile

**Scenario: Usuario actualiza su nombre**
- **Given** un usuario autenticado
- **When** actualiza su perfil con name "Nuevo Nombre"
- **Then** DEBE actualizarse el nombre
- **And** updatedAt DEBE actualizarse

**Scenario: Usuario actualiza su avatar**
- **Given** un usuario autenticado
- **When** actualiza su perfil con avatarUrl "https://example.com/avatar.jpg"
- **Then** DEBE actualizarse el avatarUrl

**Scenario: Usuario envía URL de avatar inválida**
- **Given** un usuario autenticado
- **When** actualiza su perfil con avatarUrl "not-a-url"
- **Then** DEBE recibir error de validación

**Scenario: Usuario envía nombre vacío**
- **Given** un usuario autenticado
- **When** actualiza su perfil con name ""
- **Then** DEBE recibir error de validación

---

## 2. Teams

### 2.1 Create Team

**Scenario: Usuario crea un equipo**
- **Given** un usuario autenticado
- **When** crea un equipo con name "Mi Equipo"
- **Then** DEBE crearse el equipo
- **And** el usuario DEBE ser owner del equipo
- **And** DEBE existir una membresía con role "owner"

**Scenario: Usuario crea equipo con nombre duplicado (permitido)**
- **Given** existe un equipo "Alpha Team" de otro usuario
- **When** un usuario crea un equipo con name "Alpha Team"
- **Then** DEBE crearse el equipo (nombres no son únicos globalmente)

**Scenario: Usuario crea equipo sin nombre**
- **Given** un usuario autenticado
- **When** intenta crear un equipo con name ""
- **Then** DEBE recibir error de validación

**Scenario: Usuario crea equipo con nombre muy largo**
- **Given** un usuario autenticado
- **When** intenta crear un equipo con name de 101+ caracteres
- **Then** DEBE recibir error de validación

### 2.2 Get Team

**Scenario: Miembro obtiene información del equipo**
- **Given** un usuario es miembro del equipo "Team A"
- **When** solicita información de "Team A"
- **Then** DEBE recibir id, name, description, createdAt, memberCount

**Scenario: No-miembro intenta obtener equipo**
- **Given** un usuario NO es miembro del equipo "Team A"
- **When** solicita información de "Team A"
- **Then** DEBE recibir error FORBIDDEN

**Scenario: Usuario solicita equipo inexistente**
- **Given** un usuario autenticado
- **When** solicita información de equipo con id inexistente
- **Then** DEBE recibir error NOT_FOUND

### 2.3 List My Teams

**Scenario: Usuario lista sus equipos**
- **Given** un usuario es miembro de equipos "Team A" y "Team B"
- **When** solicita sus equipos
- **Then** DEBE recibir lista con "Team A" y "Team B"
- **And** cada equipo DEBE incluir el role del usuario

**Scenario: Usuario sin equipos**
- **Given** un usuario no pertenece a ningún equipo
- **When** solicita sus equipos
- **Then** DEBE recibir lista vacía

### 2.4 Update Team

**Scenario: Owner actualiza equipo**
- **Given** un usuario es owner de "Team A"
- **When** actualiza name a "Team Alpha"
- **Then** DEBE actualizarse el nombre

**Scenario: Admin actualiza equipo**
- **Given** un usuario es admin de "Team A"
- **When** actualiza description
- **Then** DEBE actualizarse la description

**Scenario: Member intenta actualizar equipo**
- **Given** un usuario es member de "Team A"
- **When** intenta actualizar el nombre
- **Then** DEBE recibir error FORBIDDEN

### 2.5 Delete Team

**Scenario: Owner elimina equipo**
- **Given** un usuario es owner de "Team A"
- **When** elimina el equipo
- **Then** el equipo DEBE eliminarse
- **And** todas las membresías DEBEN eliminarse (cascade)
- **And** todas las invitaciones DEBEN eliminarse (cascade)

**Scenario: Admin intenta eliminar equipo**
- **Given** un usuario es admin de "Team A"
- **When** intenta eliminar el equipo
- **Then** DEBE recibir error FORBIDDEN

---

## 3. Team Memberships

### 3.1 List Team Members

**Scenario: Miembro lista miembros del equipo**
- **Given** un usuario es miembro de "Team A" con 3 miembros
- **When** solicita la lista de miembros
- **Then** DEBE recibir 3 miembros con id, name, email, role, joinedAt

### 3.2 Update Member Role

**Scenario: Owner cambia role de member a admin**
- **Given** un usuario es owner de "Team A"
- **And** existe un member "User B"
- **When** cambia el role de "User B" a "admin"
- **Then** el role DEBE actualizarse

**Scenario: Admin intenta cambiar role**
- **Given** un usuario es admin de "Team A"
- **When** intenta cambiar el role de otro miembro
- **Then** DEBE recibir error FORBIDDEN

**Scenario: Owner intenta cambiar su propio role**
- **Given** un usuario es owner de "Team A"
- **When** intenta cambiar su propio role a "admin"
- **Then** DEBE recibir error (owner no puede degradarse)

**Scenario: Promover a owner (transferir ownership)**
- **Given** un usuario es owner de "Team A"
- **And** existe un admin "User B"
- **When** cambia el role de "User B" a "owner"
- **Then** "User B" DEBE ser el nuevo owner
- **And** el usuario original DEBE pasar a "admin"

### 3.3 Remove Member

**Scenario: Owner remueve member**
- **Given** un usuario es owner de "Team A"
- **When** remueve a "User B" (member)
- **Then** "User B" ya NO DEBE ser miembro

**Scenario: Admin remueve member**
- **Given** un usuario es admin de "Team A"
- **When** remueve a "User B" (member)
- **Then** "User B" ya NO DEBE ser miembro

**Scenario: Admin intenta remover otro admin**
- **Given** un usuario es admin de "Team A"
- **When** intenta remover a otro admin
- **Then** DEBE recibir error FORBIDDEN

**Scenario: Remover al owner**
- **Given** un usuario es admin de "Team A"
- **When** intenta remover al owner
- **Then** DEBE recibir error FORBIDDEN

### 3.4 Leave Team

**Scenario: Member abandona equipo**
- **Given** un usuario es member de "Team A"
- **When** abandona el equipo
- **Then** ya NO DEBE ser miembro

**Scenario: Owner intenta abandonar equipo**
- **Given** un usuario es owner de "Team A"
- **When** intenta abandonar el equipo
- **Then** DEBE recibir error (debe transferir ownership primero)

**Scenario: Owner único abandona equipo**
- **Given** un usuario es el único miembro (owner) de "Team A"
- **When** intenta abandonar
- **Then** DEBE recibir error (debe eliminar el equipo en su lugar)

---

## 4. Team Invitations

### 4.1 Invite to Team

**Scenario: Owner invita usuario por email**
- **Given** un usuario es owner de "Team A"
- **When** invita a "newuser@example.com" como "member"
- **Then** DEBE crearse una invitación con token único
- **And** status DEBE ser "pending"
- **And** expiresAt DEBE ser 7 días en el futuro

**Scenario: Admin invita usuario**
- **Given** un usuario es admin de "Team A"
- **When** invita a un email como "member"
- **Then** DEBE crearse la invitación

**Scenario: Admin intenta invitar como admin**
- **Given** un usuario es admin de "Team A"
- **When** intenta invitar a alguien como "admin"
- **Then** DEBE recibir error FORBIDDEN (solo owner puede invitar admins)

**Scenario: Invitar usuario ya miembro**
- **Given** "user@example.com" ya es miembro de "Team A"
- **When** se intenta invitar a "user@example.com"
- **Then** DEBE recibir error (ya es miembro)

**Scenario: Invitación pendiente duplicada**
- **Given** existe invitación pendiente para "user@example.com" en "Team A"
- **When** se intenta crear otra invitación
- **Then** DEBE recibir error (invitación ya existe)

### 4.2 Accept Invitation

**Scenario: Usuario acepta invitación válida**
- **Given** un usuario autenticado con email "user@example.com"
- **And** existe invitación pendiente para ese email en "Team A"
- **When** acepta la invitación con el token
- **Then** DEBE convertirse en miembro de "Team A"
- **And** la invitación DEBE marcarse como "accepted"

**Scenario: Usuario acepta invitación para otro email**
- **Given** un usuario autenticado con email "user@example.com"
- **And** existe invitación para "other@example.com"
- **When** intenta aceptar esa invitación
- **Then** DEBE recibir error FORBIDDEN

**Scenario: Aceptar invitación expirada**
- **Given** existe invitación expirada para el usuario
- **When** intenta aceptar
- **Then** DEBE recibir error (invitación expirada)
- **And** status DEBE actualizarse a "expired"

**Scenario: Token de invitación inválido**
- **Given** un token que no existe
- **When** un usuario intenta aceptar
- **Then** DEBE recibir error NOT_FOUND

### 4.3 Reject Invitation

**Scenario: Usuario rechaza invitación**
- **Given** un usuario con invitación pendiente
- **When** rechaza la invitación
- **Then** status DEBE actualizarse a "rejected"

### 4.4 Cancel Invitation

**Scenario: Owner cancela invitación**
- **Given** un owner tiene una invitación pendiente en su equipo
- **When** cancela la invitación
- **Then** la invitación DEBE eliminarse

### 4.5 List My Invitations

**Scenario: Usuario lista sus invitaciones pendientes**
- **Given** un usuario tiene 2 invitaciones pendientes
- **When** solicita sus invitaciones
- **Then** DEBE recibir las 2 invitaciones con teamName, role, invitedBy, expiresAt

---

## 5. Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View team | ✅ | ✅ | ✅ |
| Update team | ✅ | ✅ | ❌ |
| Delete team | ✅ | ❌ | ❌ |
| View members | ✅ | ✅ | ✅ |
| Invite as member | ✅ | ✅ | ❌ |
| Invite as admin | ✅ | ❌ | ❌ |
| Remove member | ✅ | ✅ | ❌ |
| Remove admin | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |
| Leave team | ❌* | ✅ | ✅ |
| Cancel invitations | ✅ | ✅ | ❌ |

*Owner debe transferir ownership primero

---

## 6. Validation Rules

### Team Name
- MUST NOT be empty
- MUST be 1-100 characters
- MAY contain any UTF-8 characters

### Team Description
- MAY be null
- MUST be max 1000 characters if provided

### Avatar URL
- MAY be null
- MUST be valid URL if provided
- MUST start with https://

### Invitation
- Token: 64 caracteres hexadecimales (crypto random)
- Expiration: 7 días por defecto
- Email: Must be valid email format
