# API Endpoints Documentation

## Overview

This document provides detailed information about the API endpoints available in the MPD Concursos application. The API follows RESTful principles and uses JWT for authentication.

## Authentication

### Register

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Registers a new user
- **Request Body**:
  ```json
  {
    "username": "user123",
    "password": "password123",
    "confirmPassword": "password123",
    "email": "user@example.com",
    "dni": "12345678",
    "cuit": "20123456789",
    "nombre": "John",
    "apellido": "Doe"
  }
  ```
- **Response**: User details and JWT token

### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates a user and returns a JWT token
- **Request Body**:
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **Response**: JWT token and user details

## Contests

### Get All Contests

- **URL**: `/api/contests/search`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Returns a list of all contests
- **Query Parameters**:
  - `id` (optional): Filter by contest ID
  - `startDate` (optional): Filter by start date
  - `endDate` (optional): Filter by end date
  - `department` (optional): Filter by department
  - `status` (optional): Filter by status
- **Response**: List of contests

### Get Contest Details

- **URL**: `/api/contests/{id}`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Returns details of a specific contest
- **Response**: Contest details

## Inscriptions

### Create Inscription

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

### Get User Inscriptions

- **URL**: `/api/inscriptions/user`
- **Method**: `GET`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Returns all inscriptions for the current user
- **Response**: List of inscriptions

### Get Inscription Details

- **URL**: `/api/inscriptions/{id}`
- **Method**: `GET`
- **Auth Required**: Yes (ROLE_USER or ROLE_ADMIN)
- **Description**: Returns details of a specific inscription
- **Response**: Inscription details

### Update Inscription Step

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

### Update Inscription Status (User)

- **URL**: `/api/inscriptions/{id}/user-status`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Allows a user to update the status of their own inscription when completing the process
- **Query Parameters**:
  - `status`: New status ("PENDING", "COMPLETED_WITH_DOCS", or "COMPLETED_PENDING_DOCS")
- **Response**: 200 OK if successful
- **Notes**:
  - This endpoint is used when a user completes the inscription process
  - It automatically sends a notification to administrators about the completed inscription
  - Only the user who created the inscription can update its status
  - Allows changing to PENDING, COMPLETED_WITH_DOCS, or COMPLETED_PENDING_DOCS states
  - COMPLETED_PENDING_DOCS is used for provisional inscriptions with incomplete documentation

### Update Inscription Status (Admin)

- **URL**: `/api/inscriptions/{id}/status`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_ADMIN)
- **Description**: Allows an admin to update the status of any inscription
- **Query Parameters**:
  - `status`: New status (APPROVED, REJECTED, etc.)
- **Response**: 200 OK if successful
- **Notes**:
  - This endpoint is used by administrators to approve or reject inscriptions
  - It automatically sends a notification to the user about the status change
  - Only administrators can use this endpoint
  - Allows changing to any valid status (APPROVED, REJECTED, etc.)

### Cancel Inscription

- **URL**: `/api/inscriptions/{id}/cancel`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Cancels an inscription
- **Response**: 200 OK if successful
- **Notes**:
  - This endpoint is used by users to cancel their inscriptions
  - Only the user who created the inscription can cancel it
  - Cancellation is permanent and cannot be undone
  - The user will receive a notification confirming the cancellation

## Notifications

### Get User Notifications

- **URL**: `/api/v1/notifications`
- **Method**: `GET`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Returns all notifications for the current user
- **Response**: List of notifications

### Send Notification

- **URL**: `/api/v1/notifications`
- **Method**: `POST`
- **Auth Required**: Yes (ROLE_ADMIN)
- **Description**: Sends a notification to a user
- **Request Body**:
  ```json
  {
    "recipientUsername": "user123",
    "subject": "Notification Subject",
    "content": "Notification Content",
    "type": "INSCRIPTION",
    "acknowledgementLevel": "SIMPLE"
  }
  ```
- **Response**: Notification details

### Mark Notification as Read

- **URL**: `/api/v1/notifications/{id}/read`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Marks a notification as read
- **Response**: Updated notification

### Acknowledge Notification

- **URL**: `/api/v1/notifications/{id}/acknowledge`
- **Method**: `PATCH`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Acknowledges a notification
- **Request Body**:
  ```json
  {
    "signatureType": "PIN",
    "signatureValue": "1234"
  }
  ```
- **Response**: Updated notification

## User Profile

### Get Current User Profile

- **URL**: `/api/users/me`
- **Method**: `GET`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Returns the profile of the current user
- **Response**: User profile

### Update User Profile

- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **Auth Required**: Yes (ROLE_USER)
- **Description**: Updates the profile of the current user
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "telefono": "1234567890",
    "direccion": "123 Main St"
  }
  ```
- **Response**: Updated user profile
