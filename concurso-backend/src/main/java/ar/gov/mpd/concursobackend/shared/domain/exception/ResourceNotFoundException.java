package ar.gov.mpd.concursobackend.shared.domain.exception;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private String resourceName;
    private String fieldName;
    private String fieldValue;

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Constructor with resource details
     *
     * @param resourceName The name of the resource
     * @param fieldName The name of the field
     * @param fieldValue The value of the field
     */
    public ResourceNotFoundException(String resourceName, String fieldName, String fieldValue) {
        super(String.format("%s not found with %s: %s", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    /**
     * Get the name of the resource
     *
     * @return The resource name
     */
    public String getResourceName() {
        return resourceName;
    }

    /**
     * Get the name of the field
     *
     * @return The field name
     */
    public String getFieldName() {
        return fieldName;
    }

    /**
     * Get the value of the field
     *
     * @return The field value
     */
    public String getFieldValue() {
        return fieldValue;
    }
}