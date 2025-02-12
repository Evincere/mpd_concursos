package ar.gov.mpd.concursobackend.notification.domain.enums;

public enum SignatureType {
    PIN("Firma con PIN", "Firma mediante PIN de usuario"),
    DIGITAL_CERT("Certificado Digital", "Firma con certificado digital"),
    BIOMETRIC("Firma Biométrica", "Firma manuscrita digital"),
    DECLARATION("Declaración Jurada", "Declaración jurada con datos personales");

    private final String name;
    private final String description;

    SignatureType(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}