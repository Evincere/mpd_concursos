package ar.gov.mpd.concursobackend.document.application.service;

public class DocumentNotFoundException extends RuntimeException {
    public DocumentNotFoundException(String message) {
        super(message);
    }
}
