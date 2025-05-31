import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InscriptionSessionService } from './inscription-session.service';
import { environment } from '@environments/environment';
import { InscriptionSessionRequest } from '@shared/interfaces/inscripcion/inscription-session.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

describe('InscriptionSessionService', () => {
  let service: InscriptionSessionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/inscription-sessions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InscriptionSessionService]
    });
    service = TestBed.inject(InscriptionSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveSession', () => {
    it('should save a session and return the response', () => {
      // Arrange
      const mockRequest: InscriptionSessionRequest = {
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        currentStep: InscriptionStep.TERMS_ACCEPTANCE,
        formData: {
          termsAccepted: true,
          selectedCircunscripciones: ['Primera']
        }
      };

      const mockResponse = {
        id: '987e6543-e21b-43d3-b654-426614174999',
        inscriptionId: mockRequest.inscriptionId,
        contestId: mockRequest.contestId,
        userId: '456e7890-e12b-34d5-c678-426614174111',
        currentStep: mockRequest.currentStep,
        formData: mockRequest.formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString()
      };

      // Act
      service.saveSession(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle errors when saving a session', () => {
      // Arrange
      const mockRequest: InscriptionSessionRequest = {
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        currentStep: InscriptionStep.TERMS_ACCEPTANCE,
        formData: {
          termsAccepted: true,
          selectedCircunscripciones: ['Primera']
        }
      };

      const mockError = { status: 500, statusText: 'Server Error' };

      // Act & Assert
      service.saveSession(mockRequest).subscribe({
        next: () => fail('should have failed with a 500 error'),
        error: error => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush('Internal Server Error', mockError);
    });
  });

  describe('getSessionById', () => {
    it('should get a session by ID', () => {
      // Arrange
      const sessionId = '987e6543-e21b-43d3-b654-426614174999';
      const mockResponse = {
        id: sessionId,
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        userId: '456e7890-e12b-34d5-c678-426614174111',
        currentStep: InscriptionStep.TERMS_ACCEPTANCE,
        formData: {
          termsAccepted: true,
          selectedCircunscripciones: ['Primera']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString()
      };

      // Act
      service.getSessionById(sessionId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/${sessionId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSessionByInscriptionId', () => {
    it('should get a session by inscription ID', () => {
      // Arrange
      const inscriptionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse = {
        id: '987e6543-e21b-43d3-b654-426614174999',
        inscriptionId: inscriptionId,
        contestId: 1,
        userId: '456e7890-e12b-34d5-c678-426614174111',
        currentStep: InscriptionStep.TERMS_ACCEPTANCE,
        formData: {
          termsAccepted: true,
          selectedCircunscripciones: ['Primera']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString()
      };

      // Act
      service.getSessionByInscriptionId(inscriptionId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/inscription/${inscriptionId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSessionByContestId', () => {
    it('should get a session by contest ID', () => {
      // Arrange
      const contestId = 1;
      const mockResponse = {
        id: '987e6543-e21b-43d3-b654-426614174999',
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: contestId,
        userId: '456e7890-e12b-34d5-c678-426614174111',
        currentStep: InscriptionStep.TERMS_ACCEPTANCE,
        formData: {
          termsAccepted: true,
          selectedCircunscripciones: ['Primera']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString()
      };

      // Act
      service.getSessionByContestId(contestId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/contest/${contestId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateSession', () => {
    it('should update a session and return the response', () => {
      // Arrange
      const sessionId = '987e6543-e21b-43d3-b654-426614174999';
      const mockRequest: InscriptionSessionRequest = {
        inscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        contestId: 1,
        currentStep: InscriptionStep.LOCATION_SELECTION,
        formData: {
          termsAccepted: true,
          selectedCircunscripciones: ['Primera', 'Segunda']
        }
      };

      const mockResponse = {
        id: sessionId,
        inscriptionId: mockRequest.inscriptionId,
        contestId: mockRequest.contestId,
        userId: '456e7890-e12b-34d5-c678-426614174111',
        currentStep: mockRequest.currentStep,
        formData: mockRequest.formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString()
      };

      // Act
      service.updateSession(sessionId, mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/${sessionId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      // Arrange
      const sessionId = '987e6543-e21b-43d3-b654-426614174999';

      // Act
      service.deleteSession(sessionId).subscribe(response => {
        expect(response).toBeTruthy();
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/${sessionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('deleteSessionByInscriptionId', () => {
    it('should delete a session by inscription ID', () => {
      // Arrange
      const inscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      service.deleteSessionByInscriptionId(inscriptionId).subscribe(response => {
        expect(response).toBeTruthy();
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/inscription/${inscriptionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('convertStepToEnum and convertEnumToStep', () => {
    it('should convert numeric step to enum correctly', () => {
      expect(service.convertStepToEnum(1)).toBe(InscriptionStep.TERMS_ACCEPTANCE);
      expect(service.convertStepToEnum(2)).toBe(InscriptionStep.LOCATION_SELECTION);
      expect(service.convertStepToEnum(3)).toBe(InscriptionStep.DOCUMENTATION);
      expect(service.convertStepToEnum(4)).toBe(InscriptionStep.DATA_CONFIRMATION);
      expect(service.convertStepToEnum(0)).toBe(InscriptionStep.INITIAL);
      expect(service.convertStepToEnum(999)).toBe(InscriptionStep.INITIAL); // Default case
    });

    it('should convert enum step to numeric correctly', () => {
      expect(service.convertEnumToStep(InscriptionStep.TERMS_ACCEPTANCE)).toBe(1);
      expect(service.convertEnumToStep(InscriptionStep.LOCATION_SELECTION)).toBe(2);
      expect(service.convertEnumToStep(InscriptionStep.DOCUMENTATION)).toBe(3);
      expect(service.convertEnumToStep(InscriptionStep.DATA_CONFIRMATION)).toBe(4);
      expect(service.convertEnumToStep(InscriptionStep.INITIAL)).toBe(0);
      expect(service.convertEnumToStep(InscriptionStep.COMPLETED)).toBe(0); // Default case
    });
  });
});
