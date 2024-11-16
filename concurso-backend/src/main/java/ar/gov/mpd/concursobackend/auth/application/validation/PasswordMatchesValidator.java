package ar.gov.mpd.concursobackend.auth.application.validation;

import ar.gov.mpd.concursobackend.auth.application.dto.UserCreateDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, UserCreateDto> {

    @Override
    public boolean isValid(UserCreateDto userCreateDto, ConstraintValidatorContext context) {
        boolean valid = userCreateDto.getPassword().equals(userCreateDto.getConfirmPassword());

        if (!valid) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Las contraseñas no coinciden")
                   .addPropertyNode("confirmPassword")
                   .addConstraintViolation();
        }
        
        return valid;
    }
} 