/**
 * CV Migration Service Tests
 */

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CvMigrationService, MigrationStrategy, MigrationStatus } from './cv-migration.service';
import { FeatureToggleService } from '../feature-toggle.service';
import { ExperienceCvService } from './experience-cv.service';
import { EducationCvService } from './education-cv.service';
import { CvStateService } from './cv-state.service';
import { ExperienceService } from '../experience/experience.service';
import { EducacionService } from '../educacion/educacion.service';

import { Experience, Education, CvData } from '../../models/cv';

describe('CvMigrationService', () => {
  let service: CvMigrationService;
  let featureToggleService: jasmine.SpyObj<FeatureToggleService>;
  let newExperienceService: jasmine.SpyObj<ExperienceCvService>;
  let newEducationService: jasmine.SpyObj<EducationCvService>;
  let newStateService: jasmine.SpyObj<CvStateService>;
  let legacyExperienceService: jasmine.SpyObj<ExperienceService>;
  let legacyEducationService: jasmine.SpyObj<EducacionService>;

  const mockExperience: Experience = {
    id: '1',
    userId: 'user1',
    position: 'Developer',
    company: 'Tech Corp',
    startDate: new Date('2020-01-01'),
    endDate: new Date('2023-01-01'),
    description: 'Software development',
    location: 'Remote'
  };

  const mockEducation: Education = {
    id: '1',
    userId: 'user1',
    type: 'UNIVERSITY_DEGREE' as any,
    institution: 'University',
    title: 'Computer Science',
    startDate: new Date('2016-01-01'),
    endDate: new Date('2020-01-01'),
    status: 'COMPLETED' as any
  };

  const mockCvData: CvData = {
    experiences: [mockExperience],
    education: [mockEducation],
    lastUpdated: new Date()
  };

  beforeEach(() => {
    const featureToggleSpy = jasmine.createSpyObj('FeatureToggleService', [
      'getCvMigrationStrategy'
    ]);

    const newExperienceSpy = jasmine.createSpyObj('ExperienceCvService', [
      'create', 'update', 'delete', 'getAllByUserId'
    ]);

    const newEducationSpy = jasmine.createSpyObj('EducationCvService', [
      'create', 'update', 'delete', 'getAllByUserId'
    ]);

    const newStateSpy = jasmine.createSpyObj('CvStateService', [
      'loadUserCv'
    ]);

    const legacyExperienceSpy = jasmine.createSpyObj('ExperienceService', [
      'createExperience', 'updateExperience', 'deleteExperience', 'getAllExperiencesByUserId'
    ]);

    const legacyEducationSpy = jasmine.createSpyObj('EducacionService', [
      'obtenerEducacionPorUsuario'
    ]);

    TestBed.configureTestingModule({
      providers: [
        CvMigrationService,
        { provide: FeatureToggleService, useValue: featureToggleSpy },
        { provide: ExperienceCvService, useValue: newExperienceSpy },
        { provide: EducationCvService, useValue: newEducationSpy },
        { provide: CvStateService, useValue: newStateSpy },
        { provide: ExperienceService, useValue: legacyExperienceSpy },
        { provide: EducacionService, useValue: legacyEducationSpy }
      ]
    });

    service = TestBed.inject(CvMigrationService);
    featureToggleService = TestBed.inject(FeatureToggleService) as jasmine.SpyObj<FeatureToggleService>;
    newExperienceService = TestBed.inject(ExperienceCvService) as jasmine.SpyObj<ExperienceCvService>;
    newEducationService = TestBed.inject(EducationCvService) as jasmine.SpyObj<EducationCvService>;
    newStateService = TestBed.inject(CvStateService) as jasmine.SpyObj<CvStateService>;
    legacyExperienceService = TestBed.inject(ExperienceService) as jasmine.SpyObj<ExperienceService>;
    legacyEducationService = TestBed.inject(EducacionService) as jasmine.SpyObj<EducacionService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentStrategy', () => {
    it('should return strategy based on feature flags', () => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      const strategy = service.getCurrentStrategy();

      expect(strategy.useNewExperienceService).toBe(true);
      expect(strategy.useNewEducationService).toBe(true);
      expect(strategy.useNewStateManagement).toBe(true);
      expect(strategy.enableDataValidation).toBe(true);
      expect(strategy.fallbackToLegacy).toBe(false);
    });

    it('should fallback to legacy when real services disabled', () => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: false,
        useStandardizedModels: false,
        useEnhancedValidation: false
      });

      const strategy = service.getCurrentStrategy();

      expect(strategy.useNewExperienceService).toBe(false);
      expect(strategy.useNewEducationService).toBe(false);
      expect(strategy.useNewStateManagement).toBe(false);
      expect(strategy.fallbackToLegacy).toBe(true);
    });
  });

  describe('getMigrationStatus', () => {
    it('should return legacy phase when fallback enabled', () => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: false,
        useStandardizedModels: false,
        useEnhancedValidation: false
      });

      const status = service.getMigrationStatus();

      expect(status.phase).toBe('legacy');
      expect(status.experienceService).toBe('legacy');
      expect(status.educationService).toBe('legacy');
      expect(status.stateManagement).toBe('legacy');
    });

    it('should return new phase when all services enabled', () => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      const status = service.getMigrationStatus();

      expect(status.phase).toBe('new');
      expect(status.experienceService).toBe('new');
      expect(status.educationService).toBe('new');
      expect(status.stateManagement).toBe('new');
    });

    it('should return hybrid phase when partially enabled', () => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: false,
        useEnhancedValidation: true
      });

      const status = service.getMigrationStatus();

      expect(status.phase).toBe('hybrid');
    });
  });

  describe('loadUserCv', () => {
    it('should use new state service when enabled', (done) => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      newStateService.loadUserCv.and.returnValue(of(mockCvData));

      service.loadUserCv('user1').subscribe(result => {
        expect(result).toEqual(mockCvData);
        expect(newStateService.loadUserCv).toHaveBeenCalledWith('user1');
        done();
      });
    });

    it('should fallback to legacy services when new state service fails', (done) => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      newStateService.loadUserCv.and.returnValue(throwError(() => new Error('Service error')));
      legacyExperienceService.getAllExperiencesByUserId.and.returnValue(of([]));
      legacyEducationService.obtenerEducacionPorUsuario.and.returnValue(of({
        exito: true,
        data: []
      }));

      service.loadUserCv('user1').subscribe(result => {
        expect(result.experiences).toEqual([]);
        expect(result.education).toEqual([]);
        expect(legacyExperienceService.getAllExperiencesByUserId).toHaveBeenCalledWith('user1');
        done();
      });
    });
  });

  describe('createExperience', () => {
    it('should use new service when enabled', (done) => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      const mockResult = { success: true, data: mockExperience, message: 'Created' };
      newExperienceService.create.and.returnValue(of(mockResult));

      service.createExperience('user1', mockExperience).subscribe(result => {
        expect(result).toEqual(mockResult);
        expect(newExperienceService.create).toHaveBeenCalledWith('user1', mockExperience);
        done();
      });
    });

    it('should fallback to legacy service when new service fails', (done) => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      newExperienceService.create.and.returnValue(throwError(() => new Error('Service error')));
      legacyExperienceService.createExperience.and.returnValue(of(mockExperience as any));

      service.createExperience('user1', mockExperience).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toContain('legacy');
        done();
      });
    });
  });

  describe('testMigrationReadiness', () => {
    it('should return ready when all conditions met', (done) => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: true,
        useEnhancedValidation: true
      });

      service.testMigrationReadiness().subscribe(result => {
        expect(result.ready).toBe(true);
        expect(result.issues.length).toBe(0);
        done();
      });
    });

    it('should return not ready when standardized models disabled', (done) => {
      featureToggleService.getCvMigrationStrategy.and.returnValue({
        useRealServices: true,
        useStandardizedModels: false,
        useEnhancedValidation: true
      });

      service.testMigrationReadiness().subscribe(result => {
        expect(result.ready).toBe(false);
        expect(result.issues).toContain('Standardized models feature flag not enabled');
        done();
      });
    });
  });
});
