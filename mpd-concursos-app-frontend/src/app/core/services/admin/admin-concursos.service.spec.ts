import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AdminConcursosService, ConcursoFilter, ConcursoPage } from './admin-concursos.service';
import { environment } from '../../../../environments/environment';
import { Concurso, ContestStatus } from '../../../shared/interfaces/concurso/concurso.interface';

describe('AdminConcursosService', () => {
  let service: AdminConcursosService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin/contests`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminConcursosService]
    });
    service = TestBed.inject(AdminConcursosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getConcursos', () => {
    it('should return concursos with pagination', () => {
      const mockResponse: ConcursoPage = {
        content: [
          {
            id: 1,
            title: 'Test Concurso',
            position: 'Test Position',
            department: 'INFORMATICA',
            category: 'PROFESIONAL',
            status: 'ACTIVE',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31')
          } as Concurso
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0
      };

      const filter: ConcursoFilter = {
        search: 'test',
        status: 'ACTIVE',
        page: 0,
        size: 10
      };

      service.getConcursos(filter).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.content.length).toBe(1);
        expect(response.totalElements).toBe(1);
      });

      const req = httpMock.expectOne(request => {
        return request.url === apiUrl && 
               request.params.get('search') === 'test' &&
               request.params.get('status') === 'ACTIVE' &&
               request.params.get('page') === '0' &&
               request.params.get('size') === '10';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty filters', () => {
      const mockResponse: ConcursoPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      };

      service.getConcursos().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle errors gracefully', () => {
      service.getConcursos().subscribe(response => {
        expect(response.content).toEqual([]);
        expect(response.totalElements).toBe(0);
      });

      const req = httpMock.expectOne(apiUrl);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getConcursoById', () => {
    it('should return a specific concurso', () => {
      const mockConcurso: Concurso = {
        id: 1,
        title: 'Test Concurso',
        position: 'Test Position',
        department: 'INFORMATICA',
        category: 'PROFESIONAL',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      } as Concurso;

      service.getConcursoById(1).subscribe(concurso => {
        expect(concurso).toEqual(mockConcurso);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConcurso);
    });
  });

  describe('createConcurso', () => {
    it('should create a new concurso', () => {
      const newConcurso = {
        title: 'New Concurso',
        position: 'New Position',
        department: 'INFORMATICA',
        category: 'PROFESIONAL',
        status: 'DRAFT',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const mockResponse: Concurso = {
        id: 1,
        ...newConcurso
      } as Concurso;

      service.createConcurso(newConcurso as any).subscribe(concurso => {
        expect(concurso).toEqual(mockResponse);
        expect(concurso.id).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newConcurso);
      req.flush(mockResponse);
    });
  });

  describe('updateConcurso', () => {
    it('should update an existing concurso', () => {
      const updatedConcurso = {
        id: 1,
        title: 'Updated Concurso',
        position: 'Updated Position',
        department: 'INFORMATICA',
        category: 'PROFESIONAL',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      service.updateConcurso(updatedConcurso as any).subscribe(concurso => {
        expect(concurso).toEqual(updatedConcurso);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedConcurso);
      req.flush(updatedConcurso);
    });
  });

  describe('changeStatus', () => {
    it('should change concurso status', () => {
      const mockConcurso: Concurso = {
        id: 1,
        title: 'Test Concurso',
        status: 'ACTIVE'
      } as Concurso;

      service.changeStatus(1, 'ACTIVE').subscribe(concurso => {
        expect(concurso.status).toBe('ACTIVE');
      });

      const req = httpMock.expectOne(`${apiUrl}/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'ACTIVE' });
      req.flush(mockConcurso);
    });
  });

  describe('deleteConcurso', () => {
    it('should delete a concurso', () => {
      service.deleteConcurso(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getStats', () => {
    it('should return contest statistics', () => {
      const mockStats = {
        total: 10,
        active: 5,
        draft: 2,
        closed: 3,
        inProgress: 0,
        cancelled: 0,
        byDepartment: { 'INFORMATICA': 5, 'LEGAL': 3 },
        byCategory: { 'PROFESIONAL': 7, 'TECNICO': 3 }
      };

      service.getStats().subscribe(stats => {
        expect(stats).toEqual(mockStats);
        expect(stats.total).toBe(10);
        expect(stats.active).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('getDepartments', () => {
    it('should return available departments', () => {
      const mockDepartments = ['INFORMATICA', 'RECURSOS_HUMANOS', 'CONTADURIA'];

      service.getDepartments().subscribe(departments => {
        expect(departments).toEqual(mockDepartments);
        expect(departments.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/departments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDepartments);
    });

    it('should return fallback departments on error', () => {
      service.getDepartments().subscribe(departments => {
        expect(departments.length).toBeGreaterThan(0);
        expect(departments).toContain('INFORMATICA');
      });

      const req = httpMock.expectOne(`${apiUrl}/departments`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getCategories', () => {
    it('should return available categories', () => {
      const mockCategories = ['PROFESIONAL', 'TECNICO', 'ADMINISTRATIVO'];

      service.getCategories().subscribe(categories => {
        expect(categories).toEqual(mockCategories);
        expect(categories.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });
  });

  describe('getPositions', () => {
    it('should return available positions', () => {
      const mockPositions = ['Desarrollador Senior', 'Analista de Sistemas'];

      service.getPositions().subscribe(positions => {
        expect(positions).toEqual(mockPositions);
        expect(positions.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/positions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPositions);
    });
  });
});
