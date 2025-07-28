package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.application.dto.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for managing documents
 */
public interface DocumentService {

    /**
     * Get all documents for a user
     *
     * @param userId User's UUID
     * @return List of documents
     */
    List<DocumentDto> getUserDocuments(UUID userId);

    /**
     * Get documents summary grouped by type, showing only the most recent version
     * with information about previous versions
     *
     * @param userId User's UUID
     * @return List of document summaries
     */
    List<DocumentSummaryDto> getUserDocumentsSummary(UUID userId);

    /**
     * Upload a document
     *
     * @param request     Upload request
     * @param inputStream Document input stream
     * @param userId      User's UUID
     * @return Document response
     * @throws IOException If an I/O error occurs
     */
    DocumentResponse uploadDocument(DocumentUploadRequest request, InputStream inputStream, UUID userId) throws IOException;

    /**
     * Get a document's metadata
     * 
     * @param documentId Document's UUID as string
     * @param userId     User's UUID
     * @return Document metadata
     */
    DocumentDto getDocumentMetadata(String documentId, UUID userId);

    /**
     * Get a document's file
     * 
     * @param documentId Document's UUID as string
     * @param userId     User's UUID
     * @return Document file as input stream
     * @throws IOException If an I/O error occurs
     */
    InputStream getDocumentFile(String documentId, UUID userId) throws IOException;

    /**
     * Update/replace a document
     *
     * @param documentId  Document's UUID as string
     * @param request     Update request
     * @param inputStream New document input stream
     * @param userId      User's UUID
     * @return Document response
     * @throws IOException If an I/O error occurs
     */
    DocumentResponse updateDocument(String documentId, DocumentUploadRequest request, InputStream inputStream, UUID userId) throws IOException;

    /**
     * Delete a document
     *
     * @param documentId Document's UUID as string
     * @param userId     User's UUID
     */
    void deleteDocument(String documentId, UUID userId);

    /**
     * Update a document's status
     * 
     * @param documentId Document's UUID as string
     * @param status     New status
     * @return Updated document
     */
    DocumentDto updateDocumentStatus(String documentId, String status);
    
    /**
     * Save a document and return its URL
     * 
     * @param inputStream Document input stream
     * @param filename    Original filename
     * @param documentId  Document's UUID
     * @param userId      User's UUID
     * @return Document URL
     * @throws IOException If an I/O error occurs
     */
    String saveDocument(InputStream inputStream, String filename, UUID documentId, UUID userId) throws IOException;

    /**
     * Replace a document with a new file, handling validation and impact on contests
     */
    DocumentReplaceResponse replaceDocument(String documentId, DocumentReplaceRequest request, InputStream inputStream, UUID userId) throws IOException;

    /**
     * Check if replacing a document has any warnings or impacts
     */
    DocumentReplaceResponse checkReplaceDocument(String documentId, DocumentReplaceRequest request, InputStream inputStream, UUID userId) throws IOException;
} 