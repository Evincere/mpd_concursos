
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DocumentManagerService } from './document-manager.service';
import { DocumentosService } from './documentos.service';
import { LoggingService } from '../logging/logging.service';
import { DocumentoUsuario, EstadoDocumento } from '../../models/documento.model';
import { cold, hot } from 'jasmine-marbles';

describe('DocumentManagerService', () => {
  let service: DocumentManagerService;
  let documentosServiceSpy: jasmine.SpyObj<DocumentosService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;

  const mockDocumentos: DocumentoUsuario[] = [
    { id: '1', nombreArchivo: 'test1.pdf', tipoDocumentoId: 'T1', fechaCarga: new Date(), estado: EstadoDocumento.APROBADO, usuarioId: 'u1' },
    { id: '2', nombreArchivo: 'test2.pdf', tipoDocumentoId: 'T2', fechaCarga: new Date(), estado: EstadoDocumento.PENDIENTE, usuarioId: 'u1' },
  ];

  beforeEach(() => {
    const docSpy = jasmine.createSpyObj('DocumentosService', ['getDocumentosUsuario', 'uploadDocumento', 'deleteDocumento']);
    const logSpy = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        DocumentManagerService,
        { provide: DocumentosService, useValue: docSpy },
        { provide: LoggingService, useValue: logSpy },
      ],
    });

    service = TestBed.inject(DocumentManagerService);
    documentosServiceSpy = TestBed.inject(DocumentosService) as jasmine.SpyObj<DocumentosService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Carga de Documentos', () => {
    beforeEach(() => {
      documentosServiceSpy.getDocumentosUsuario.and.returnValue(of(mockDocumentos));
    });

    it('debería llamar a getDocumentosUsuario en la inicialización', () => {
      // El constructor llama a cargarDocumentos, así que el spy ya debería haber sido llamado
      expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(1);
    });

    it('debería emitir los documentos desde el observable documentos$', (done) => {
      service.documentos$.subscribe(docs => {
        if (docs.length > 0) { // Ignorar el valor inicial vacío
          expect(docs).toEqual(mockDocumentos);
          done();
        }
      });
      service.cargarDocumentos();
    });

    it('debería establecer loading$ en true durante la carga y false después', () => {
      const loadingMarbles = cold('a-b', { a: true, b: false });
      documentosServiceSpy.getDocumentosUsuario.and.returnValue(of(mockDocumentos));
      
      service.cargarDocumentos();
      
      expect(service.loading$).toBeObservable(loadingMarbles);
    });

    it('debería manejar errores al cargar documentos', () => {
      const error = new Error('Error de red');
      documentosServiceSpy.getDocumentosUsuario.and.returnValue(throwError(() => error));
      const loadingMarbles = cold('a-b', { a: true, b: false });

      service.cargarDocumentos();

      expect(service.loading$).toBeObservable(loadingMarbles);
      expect(loggingServiceSpy.error).toHaveBeenCalledWith('DocumentManager', 'Error al cargar documentos', error);
    });
  });

  describe('Cache de Documentos', () => {
    
    beforeEach(() => {
        documentosServiceSpy.getDocumentosUsuario.and.returnValue(of(mockDocumentos));
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('debería usar la cache en llamadas subsecuentes dentro del tiempo de expiración', () => {
        service.cargarDocumentos(); // Primera llamada, llena la cache
        expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(1);

        service.cargarDocumentos(); // Segunda llamada, debería usar la cache
        expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(1);
    });

    it('no debería usar la cache si ha expirado', () => {
        service.cargarDocumentos();
        expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(1);

        const cacheDuration = 5 * 60 * 1000; // 5 minutos
        jasmine.clock().tick(cacheDuration + 1);

        service.cargarDocumentos();
        expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(2);
    });

    it('debería forzar la recarga si se especifica forzarRecarga = true', () => {
        service.cargarDocumentos();
        expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(1);

        service.cargarDocumentos(true); // Forzar recarga
        expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledTimes(2);
    });
  });

  describe('Subida de Documentos', () => {
    const formData = new FormData();
    const response = { documento: mockDocumentos[0] };

    beforeEach(() => {
      documentosServiceSpy.uploadDocumento.and.returnValue(of(response));
      documentosServiceSpy.getDocumentosUsuario.and.returnValue(of(mockDocumentos));
    });

    it('debería llamar a uploadDocumento y luego recargar los documentos', () => {
      service.subirDocumento(formData);
      
      expect(documentosServiceSpy.uploadDocumento).toHaveBeenCalledWith(formData);
      expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledWith(true); // Forzar recarga
    });

    it('debería emitir en documentoSubido$ en caso de éxito', (done) => {
      service.documentoSubido$.subscribe(doc => {
        expect(doc).toEqual(response.documento);
        done();
      });
      service.subirDocumento(formData);
    });
  });

  describe('Eliminación de Documentos', () => {
    const docId = '1';

    beforeEach(() => {
      documentosServiceSpy.deleteDocumento.and.returnValue(of(true));
      documentosServiceSpy.getDocumentosUsuario.and.returnValue(of(mockDocumentos.slice(1)));
    });

    it('debería llamar a deleteDocumento y luego recargar los documentos', () => {
      service.eliminarDocumento(docId);

      expect(documentosServiceSpy.deleteDocumento).toHaveBeenCalledWith(docId);
      expect(documentosServiceSpy.getDocumentosUsuario).toHaveBeenCalledWith(true);
    });

    it('debería emitir en documentoEliminado$ en caso de éxito', (done) => {
      service.documentoEliminado$.subscribe(id => {
        expect(id).toEqual(docId);
        done();
      });
      service.eliminarDocumento(docId);
    });
  });
});
