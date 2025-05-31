import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserValidationService } from './user-validation.service';
import { AdminUsersService } from '@core/services/admin/admin-users.service';
import { of } from 'rxjs';

describe('UserValidationService', () => {
  let service: UserValidationService;
  let formBuilder: FormBuilder;
  let usersService: jasmine.SpyObj<AdminUsersService>;

  beforeEach(() => {
    // Crear spy para el servicio de usuarios
    const usersServiceSpy = jasmine.createSpyObj('AdminUsersService', [
      'checkUsernameExists',
      'checkEmailExists',
      'checkDniExists'
    ]);
    
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        UserValidationService,
        FormBuilder,
        { provide: AdminUsersService, useValue: usersServiceSpy }
      ]
    });
    
    service = TestBed.inject(UserValidationService);
    formBuilder = TestBed.inject(FormBuilder);
    usersService = TestBed.inject(AdminUsersService) as jasmine.SpyObj<AdminUsersService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  describe('usernameValidator', () => {
    let control: FormGroup;
    
    beforeEach(() => {
      control = formBuilder.group({
        username: ['', [service.usernameValidator()]]
      });
    });
    
    it('should return null for valid username', () => {
      control.get('username')?.setValue('validuser123');
      expect(control.get('username')?.valid).toBe(true);
      expect(control.get('username')?.errors).toBeNull();
    });
    
    it('should return error for username that is too short', () => {
      control.get('username')?.setValue('usr');
      expect(control.get('username')?.valid).toBe(false);
      expect(control.get('username')?.errors?.['minlength']).toBeTruthy();
    });
    
    it('should return error for username that is too long', () => {
      control.get('username')?.setValue('a'.repeat(51));
      expect(control.get('username')?.valid).toBe(false);
      expect(control.get('username')?.errors?.['maxlength']).toBeTruthy();
    });
    
    it('should return error for username with invalid characters', () => {
      control.get('username')?.setValue('user@name');
      expect(control.get('username')?.valid).toBe(false);
      expect(control.get('username')?.errors?.['pattern']).toBeTruthy();
    });
  });
  
  describe('usernameExistsValidator', () => {
    let control: FormGroup;
    
    beforeEach(() => {
      control = formBuilder.group({
        username: ['', [], [service.usernameExistsValidator()]]
      });
    });
    
    it('should return null for username that does not exist', (done) => {
      // Configurar servicio para devolver false (no existe)
      usersService.checkUsernameExists.and.returnValue(of(false));
      
      control.get('username')?.setValue('newuser');
      
      // Esperar a que se complete la validación asíncrona
      setTimeout(() => {
        expect(control.get('username')?.valid).toBe(true);
        expect(control.get('username')?.errors).toBeNull();
        done();
      }, 500);
    });
    
    it('should return error for username that exists', (done) => {
      // Configurar servicio para devolver true (existe)
      usersService.checkUsernameExists.and.returnValue(of(true));
      
      control.get('username')?.setValue('existinguser');
      
      // Esperar a que se complete la validación asíncrona
      setTimeout(() => {
        expect(control.get('username')?.valid).toBe(false);
        expect(control.get('username')?.errors?.['usernameExists']).toBeTruthy();
        done();
      }, 500);
    });
    
    it('should not check if username is excluded', (done) => {
      control = formBuilder.group({
        username: ['', [], [service.usernameExistsValidator('existinguser')]]
      });
      
      control.get('username')?.setValue('existinguser');
      
      // Esperar a que se complete la validación asíncrona
      setTimeout(() => {
        expect(control.get('username')?.valid).toBe(true);
        expect(control.get('username')?.errors).toBeNull();
        expect(usersService.checkUsernameExists).not.toHaveBeenCalled();
        done();
      }, 500);
    });
  });
  
  describe('emailValidator', () => {
    let control: FormGroup;
    
    beforeEach(() => {
      control = formBuilder.group({
        email: ['', [service.emailValidator()]]
      });
    });
    
    it('should return null for valid email', () => {
      control.get('email')?.setValue('valid@example.com');
      expect(control.get('email')?.valid).toBe(true);
      expect(control.get('email')?.errors).toBeNull();
    });
    
    it('should return error for email that is too long', () => {
      const longEmail = 'a'.repeat(90) + '@example.com';
      control.get('email')?.setValue(longEmail);
      expect(control.get('email')?.valid).toBe(false);
      expect(control.get('email')?.errors?.['maxlength']).toBeTruthy();
    });
    
    it('should return error for invalid email format', () => {
      control.get('email')?.setValue('invalid-email');
      expect(control.get('email')?.valid).toBe(false);
      expect(control.get('email')?.errors?.['email']).toBeTruthy();
    });
  });
  
  describe('dniValidator', () => {
    let control: FormGroup;
    
    beforeEach(() => {
      control = formBuilder.group({
        dni: ['', [service.dniValidator()]]
      });
    });
    
    it('should return null for valid DNI', () => {
      control.get('dni')?.setValue('12345678');
      expect(control.get('dni')?.valid).toBe(true);
      expect(control.get('dni')?.errors).toBeNull();
    });
    
    it('should return error for DNI with invalid length', () => {
      control.get('dni')?.setValue('123456');
      expect(control.get('dni')?.valid).toBe(false);
      expect(control.get('dni')?.errors?.['length']).toBeTruthy();
    });
    
    it('should return error for DNI with non-numeric characters', () => {
      control.get('dni')?.setValue('1234567A');
      expect(control.get('dni')?.valid).toBe(false);
      expect(control.get('dni')?.errors?.['pattern']).toBeTruthy();
    });
  });
  
  describe('passwordValidator', () => {
    let control: FormGroup;
    
    beforeEach(() => {
      control = formBuilder.group({
        password: ['', [service.passwordValidator()]]
      });
    });
    
    it('should return null for valid password', () => {
      control.get('password')?.setValue('ValidP@ss1');
      expect(control.get('password')?.valid).toBe(true);
      expect(control.get('password')?.errors).toBeNull();
    });
    
    it('should return error for password that is too short', () => {
      control.get('password')?.setValue('Short1');
      expect(control.get('password')?.valid).toBe(false);
      expect(control.get('password')?.errors?.['minlength']).toBeTruthy();
    });
    
    it('should return error for password without uppercase letter', () => {
      control.get('password')?.setValue('password123!');
      expect(control.get('password')?.valid).toBe(false);
      expect(control.get('password')?.errors?.['uppercase']).toBeTruthy();
    });
    
    it('should return error for password without lowercase letter', () => {
      control.get('password')?.setValue('PASSWORD123!');
      expect(control.get('password')?.valid).toBe(false);
      expect(control.get('password')?.errors?.['lowercase']).toBeTruthy();
    });
    
    it('should return error for password without number', () => {
      control.get('password')?.setValue('Password!');
      expect(control.get('password')?.valid).toBe(false);
      expect(control.get('password')?.errors?.['number']).toBeTruthy();
    });
    
    it('should return error for password without special character', () => {
      control.get('password')?.setValue('Password123');
      expect(control.get('password')?.valid).toBe(false);
      expect(control.get('password')?.errors?.['specialChar']).toBeTruthy();
    });
  });
  
  describe('passwordMatchValidator', () => {
    let form: FormGroup;
    
    beforeEach(() => {
      form = formBuilder.group({
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      }, {
        validators: service.passwordMatchValidator('password', 'confirmPassword')
      });
    });
    
    it('should return null when passwords match', () => {
      form.get('password')?.setValue('Password123!');
      form.get('confirmPassword')?.setValue('Password123!');
      expect(form.valid).toBe(true);
      expect(form.errors).toBeNull();
      expect(form.get('confirmPassword')?.errors).toBeNull();
    });
    
    it('should return error when passwords do not match', () => {
      form.get('password')?.setValue('Password123!');
      form.get('confirmPassword')?.setValue('DifferentPassword123!');
      expect(form.valid).toBe(false);
      expect(form.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTruthy();
    });
  });
  
  describe('rolesValidator', () => {
    let control: FormGroup;
    
    beforeEach(() => {
      control = formBuilder.group({
        roles: [[], [service.rolesValidator()]]
      });
    });
    
    it('should return null for valid roles array', () => {
      control.get('roles')?.setValue(['USER']);
      expect(control.get('roles')?.valid).toBe(true);
      expect(control.get('roles')?.errors).toBeNull();
    });
    
    it('should return error for empty roles array', () => {
      control.get('roles')?.setValue([]);
      expect(control.get('roles')?.valid).toBe(false);
      expect(control.get('roles')?.errors?.['required']).toBeTruthy();
    });
  });
});
