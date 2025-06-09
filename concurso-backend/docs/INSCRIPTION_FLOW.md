# Inscription Process Flow Documentation

## Overview

This document describes the inscription process flow in the MPD Concursos application, including the states an inscription can have, the transitions between states, and the endpoints available for managing inscriptions.

## Inscription States

Inscriptions can be in one of the following states:

| State | Description | Who can set it |
|-------|-------------|----------------|
| `ACTIVE` (formerly `IN_PROCESS`) | Initial state when an inscription is created or in progress | System, User |
| `PENDING` | Inscription completed by user, waiting for admin validation | User |
| `APPROVED` | Inscription approved by admin | Admin |
| `REJECTED` | Inscription rejected by admin | Admin |
| `CANCELLED` | Inscription cancelled by user | User |

## State Transitions

The following state transitions are allowed:

1. `ACTIVE` → `PENDING`: When a user completes the inscription process
2. `ACTIVE` → `CANCELLED`: When a user cancels an in-progress inscription
3. `PENDING` → `APPROVED`: When an admin approves a pending inscription
4. `PENDING` → `REJECTED`: When an admin rejects a pending inscription
5. `PENDING` → `CANCELLED`: When a user cancels a pending inscription

## Inscription Steps

During the inscription process, an inscription goes through several steps:

1. `INITIAL`: Initial step when an inscription is created
2. `TERMS_ACCEPTANCE`: User accepts terms and conditions
3. `LOCATION_SELECTION`: User selects location preferences
4. `DOCUMENTATION`: User uploads required documents
5. `DATA_CONFIRMATION`: User confirms personal data
6. `COMPLETED`: All steps completed

## API Endpoints

### User Endpoints

#### Create Inscription

- **URL**: `/api/inscriptions`
- **Method**: `POST`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Creates a new inscription for a contest
- **Request Body**:
  ```json
  {
    "contestId": 1
  }
  ```
- **Response**: Inscription details

#### Update Inscription Step

- **URL**: `/api/inscriptions/{inscriptionId}/step`
- **Method**: `PUT`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Updates the current step of an inscription
- **Request Body**:
  ```json
  {
    "step": "COMPLETED",
    "centroDeVida": "Address",
    "selectedCircunscripciones": ["CIRCUNSCRIPCION_1"],
    "acceptedTerms": true,
    "confirmedPersonalData": true
  }
  ```
- **Response**: Updated inscription

#### Update Inscription Status (User)

- **URL**: `/api/inscripciones/{id}/user-status`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Allows a user to update the status of their own inscription when completing the process
- **Query Parameters**:
  - `status`: New status ("PENDING", "COMPLETED_WITH_DOCS", or "COMPLETED_PENDING_DOCS")
- **Response**: 200 OK if successful

#### Cancel Inscription

- **URL**: `/api/inscriptions/{id}/cancel`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Cancels an inscription
- **Response**: 200 OK if successful

### Admin Endpoints

#### Update Inscription Status (Admin)

- **URL**: `/api/inscripciones/{id}/status`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_ADMIN)
- **Description**: Allows an admin to update the status of any inscription
- **Query Parameters**:
  - `status`: New status (APPROVED, REJECTED, etc.)
- **Response**: 200 OK if successful

## Notification System

The system sends notifications at key points in the inscription process:

1. When a user completes an inscription and changes the status to PENDING, all administrators receive a notification.
   - This notification includes details about the inscription and the contest.
   - Administrators can click on the notification to view the inscription details.
   - The notification is sent automatically when the user completes the inscription process.

2. When an administrator approves or rejects an inscription, the user receives a notification.
   - This notification includes details about the status change and the contest.
   - The notification content varies depending on whether the inscription was approved or rejected.
   - For approved inscriptions, the notification includes information about next steps.
   - For rejected inscriptions, the notification includes contact information for questions.

3. When a user cancels an inscription, they receive a confirmation notification.
   - This notification confirms that the inscription has been cancelled.
   - It includes details about the cancelled inscription and the contest.

All notifications are stored in the system and can be viewed by users and administrators in their respective dashboards.

## Implementation Details

### Backend

The inscription process is implemented using the following components:

- **Domain Model**: `Inscription` class with status and step fields
- **Repositories**: `InscriptionRepository` for data access
- **Services**: `UpdateInscriptionStatusService`, `UpdateInscriptionStepService`
- **Controllers**: `InscriptionController`, `InscriptionUserStatusController`

### Frontend

The frontend implements the inscription process using:

- **Services**: `InscriptionService` for API communication
- **Components**: `InscriptionProcessPageComponent` for the inscription process UI
- **State Management**: Local storage for saving in-progress inscriptions

## Best Practices

1. Always validate that users can only update their own inscriptions
2. Ensure that only admins can approve or reject inscriptions
3. Validate state transitions to prevent invalid state changes
4. Send notifications to keep users and admins informed about status changes
5. Handle errors gracefully and provide clear error messages
