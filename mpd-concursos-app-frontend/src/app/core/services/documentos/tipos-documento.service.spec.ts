import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TiposDocumentoService } from './tipos-documento.service';
import { TipoDocumento } from '../../models/documento.model';
import { environment } from '../../../../environments/environment';

describe('TiposDocumentoService', () => {
  let service: TiposDocumentoService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/documentos/tipos`;

  const mockTiposDocumento: TipoDocumento[] = [
    { id: '1', nombre: 'DNI', requerido: true, activo: true, code: 'DNI', orden: 1, descripcion: '' },
    { id: '2', nombre: 'Pasaporte', requerido: false, activo: true, code: 'PASAPORTE', orden: 2, descripcion: '' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TiposDocumentoService],
    });
    service = TestBed.inject(TiposDocumentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debería obtener los tipos de documento desde la API en la primera llamada', () => {
    service.getTiposDocumento().subscribe(tipos => {
      expect(tipos.length).toBe(2);
      expect(tipos).toEqual(mockTiposDocumento);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockTiposDocumento);
  });

  it('debería devolver los tipos de documento desde la caché en llamadas subsecuentes', () => {
    service.getTiposDocumento().subscribe();

    const req1 = httpMock.expectOne(apiUrl);
    req1.flush(mockTiposDocumento);

    // Segunda llamada
    service.getTiposDocumento().subscribe(tipos => {
      expect(tipos).toEqual(mockTiposDocumento);
    });

    httpMock.expectNone(apiUrl); // No debería haber una nueva llamada HTTP
  });

  it('debería forzar una nueva llamada a la API si forzarRecarga es true', () => {
    service.getTiposDocumento().subscribe();
    const req1 = httpMock.expectOne(apiUrl);
    req1.flush(mockTiposDocumento);

    // Forzar recarga
    service.getTiposDocumento(true).subscribe();
    const req2 = httpMock.expectOne(apiUrl);
    req2.flush(mockTiposDocumento);
  });

  it('debería manejar errores de la API y devolver un array vacío', () => {
    service.getTiposDocumento().subscribe(tipos => {
      expect(tipos).toEqual([]);
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
