package ar.gov.mpd.concursobackend.audit.domain.model;

public enum AuditEventType {
    // --- User Management Events ---
    USER_CREATED,
    USER_UPDATED,
    USER_DELETED,
    STATUS_CHANGED,
    ROLES_CHANGED,
    PROFILE_UPDATED,

    // --- Authentication Events ---
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT_SUCCESS,
    PASSWORD_CHANGED,
    PASSWORD_RESET_REQUEST,
    PASSWORD_RESET_SUCCESS,

    // --- Security Events ---
    ACCOUNT_LOCKED,
    ACCOUNT_UNLOCKED,
    PERMISSIONS_DENIED,

    // --- System Events ---
    SYSTEM_STARTUP,
    SYSTEM_SHUTDOWN,
    CONFIG_CHANGED
} 