# PLAN DE IMPLEMENTACIÓN - SISTEMA CV PERSISTENCIA REAL

## 🎯 OBJETIVO
Eliminar la simulación de datos del sistema CV e implementar persistencia real conectando el frontend con el backend ya existente.

---

## 📋 FASE 1: SERVICIOS HTTP REALES (CRÍTICA - 1 día)

### 1.1 Crear ExperienceCvService

**Archivo:** `mpd-concursos-app-frontend/src/app/core/services/cv/experience-cv.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { WorkExperience, WorkExperienceDto } from '@core/models/cv';

@Injectable({
  providedIn: 'root'
})
export class ExperienceCvService {
  private apiUrl = `${environment.apiUrl}/experiencias`;
  private experiencesSubject = new BehaviorSubject<WorkExperience[]>([]);
  public experiences$ = this.experiencesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllByUserId(userId: string): Observable<WorkExperience[]> {
    return this.http.get<WorkExperience[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        tap(experiences => this.experiencesSubject.next(experiences)),
        catchError(error => {
          console.error('Error loading experiences:', error);
          throw error;
        })
      );
  }

  create(userId: string, experience: WorkExperienceDto): Observable<WorkExperience> {
    return this.http.post<WorkExperience>(`${this.apiUrl}/usuario/${userId}`, experience)
      .pipe(
        tap(newExperience => {
          const current = this.experiencesSubject.value;
          this.experiencesSubject.next([...current, newExperience]);
        })
      );
  }

  update(id: string, experience: WorkExperienceDto): Observable<WorkExperience> {
    return this.http.put<WorkExperience>(`${this.apiUrl}/${id}`, experience)
      .pipe(
        tap(updatedExperience => {
          const current = this.experiencesSubject.value;
          const index = current.findIndex(exp => exp.id === id);
          if (index !== -1) {
            current[index] = updatedExperience;
            this.experiencesSubject.next([...current]);
          }
        })
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          const current = this.experiencesSubject.value;
          const filtered = current.filter(exp => exp.id !== id);
          this.experiencesSubject.next(filtered);
          return true;
        })
      );
  }

  uploadDocument(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/${id}/documento`, formData);
  }
}
```

### 1.2 Crear EducationCvService

**Archivo:** `mpd-concursos-app-frontend/src/app/core/services/cv/education-cv.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { EducationEntry, EducationDto } from '@core/models/cv';

@Injectable({
  providedIn: 'root'
})
export class EducationCvService {
  private apiUrl = `${environment.apiUrl}/educacion`;
  private educationSubject = new BehaviorSubject<EducationEntry[]>([]);
  public education$ = this.educationSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllByUserId(userId: string): Observable<EducationEntry[]> {
    return this.http.get<EducationEntry[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        tap(education => this.educationSubject.next(education)),
        catchError(error => {
          console.error('Error loading education:', error);
          throw error;
        })
      );
  }

  create(userId: string, education: EducationDto): Observable<EducationEntry> {
    return this.http.post<EducationEntry>(`${this.apiUrl}/usuario/${userId}`, education)
      .pipe(
        tap(newEducation => {
          const current = this.educationSubject.value;
          this.educationSubject.next([...current, newEducation]);
        })
      );
  }

  update(id: string, education: EducationDto): Observable<EducationEntry> {
    return this.http.put<EducationEntry>(`${this.apiUrl}/${id}`, education)
      .pipe(
        tap(updatedEducation => {
          const current = this.educationSubject.value;
          const index = current.findIndex(edu => edu.id === id);
          if (index !== -1) {
            current[index] = updatedEducation;
            this.educationSubject.next([...current]);
          }
        })
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          const current = this.educationSubject.value;
          const filtered = current.filter(edu => edu.id !== id);
          this.educationSubject.next(filtered);
          return true;
        })
      );
  }

  uploadDocument(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/${id}/documento`, formData);
  }
}
```

### 1.3 Crear CvStateService

**Archivo:** `mpd-concursos-app-frontend/src/app/core/services/cv/cv-state.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExperienceCvService } from './experience-cv.service';
import { EducationCvService } from './education-cv.service';
import { WorkExperience, EducationEntry } from '@core/models/cv';

export interface CvState {
  experiences: WorkExperience[];
  education: EducationEntry[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class CvStateService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private lastUpdatedSubject = new BehaviorSubject<Date | null>(null);

  public isLoading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public lastUpdated$ = this.lastUpdatedSubject.asObservable();

  public cvState$: Observable<CvState> = combineLatest([
    this.experienceService.experiences$,
    this.educationService.education$,
    this.isLoading$,
    this.error$,
    this.lastUpdated$
  ]).pipe(
    map(([experiences, education, isLoading, error, lastUpdated]) => ({
      experiences,
      education,
      isLoading,
      error,
      lastUpdated
    }))
  );

  constructor(
    private experienceService: ExperienceCvService,
    private educationService: EducationCvService
  ) {}

  loadCvData(userId: string): void {
    this.setLoading(true);
    this.setError(null);

    Promise.all([
      this.experienceService.getAllByUserId(userId).toPromise(),
      this.educationService.getAllByUserId(userId).toPromise()
    ])
    .then(() => {
      this.setLoading(false);
      this.setLastUpdated(new Date());
    })
    .catch(error => {
      this.setLoading(false);
      this.setError('Error al cargar datos del CV');
      console.error('Error loading CV data:', error);
    });
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private setLastUpdated(date: Date): void {
    this.lastUpdatedSubject.next(date);
  }
}
```

---

## 📋 FASE 2: CONECTAR COMPONENTE CV (CRÍTICA - 0.5 días)

### 2.1 Modificar cv-container.component.ts

**Cambios principales:**
1. Inyectar servicios reales
2. Eliminar simulación de datos
3. Conectar a servicios HTTP

```typescript
// Reemplazar estas líneas:
// TODO: Implementar carga real desde el backend
this.simulateDataLoad('experiences').subscribe({

// Por estas líneas:
this.cvStateService.loadCvData(this.userProfile?.id || '');
this.cvStateService.cvState$.pipe(
  takeUntil(this.destroy$)
).subscribe(state => {
  this.updateState(() => ({
    experiences: {
      data: state.experiences,
      selectedItem: null,
      isLoading: state.isLoading,
      error: state.error,
      filters: CV_DEFAULTS.SEARCH_FILTERS,
      pagination: CV_DEFAULTS.PAGINATION
    },
    education: {
      data: state.education,
      selectedItem: null,
      isLoading: state.isLoading,
      error: state.error,
      filters: CV_DEFAULTS.SEARCH_FILTERS,
      pagination: CV_DEFAULTS.PAGINATION
    },
    isExporting: false,
    lastUpdated: state.lastUpdated
  }));
});
```

### 2.2 Actualizar index.ts de servicios CV

**Archivo:** `mpd-concursos-app-frontend/src/app/core/services/cv/index.ts`

```typescript
// Agregar exportaciones de nuevos servicios
export { ExperienceCvService } from './experience-cv.service';
export { EducationCvService } from './education-cv.service';
export { CvStateService } from './cv-state.service';
```

---

## 📋 FASE 3: SISTEMA DE ARCHIVOS (ALTA - 1 día)

### 3.1 Crear estructura de carpetas

**Backend - Configuración:**

```properties
# application.properties - Agregar
app.cv.document.storage.location=uploads/cv-documents
app.cv.document.max-size=10MB
app.cv.document.allowed-types=application/pdf,image/jpeg,image/png
```

### 3.2 Crear servicio de gestión de archivos CV

**Backend - Archivo:** `CvDocumentService.java`

```java
@Service
public class CvDocumentService {
    
    @Value("${app.cv.document.storage.location:uploads/cv-documents}")
    private String cvDocumentPath;
    
    public String storeExperienceDocument(UUID userId, UUID experienceId, MultipartFile file) {
        Path userPath = Paths.get(cvDocumentPath, userId.toString(), "experiences");
        // Implementar lógica de almacenamiento
    }
    
    public String storeEducationDocument(UUID userId, UUID educationId, MultipartFile file) {
        Path userPath = Paths.get(cvDocumentPath, userId.toString(), "education");
        // Implementar lógica de almacenamiento
    }
}
```

---

## 📋 FASE 4: CONSOLIDACIÓN BD (ALTA - 0.5 días)

### 4.1 Script de limpieza de tablas redundantes

**Archivo:** `cleanup_cv_tables.sql`

```sql
-- Verificar que las tablas estén vacías antes de eliminar
SELECT 
    'experience' as tabla, COUNT(*) as registros FROM experience
UNION ALL
SELECT 
    'experiencias' as tabla, COUNT(*) as registros FROM experiencias  
UNION ALL
SELECT 
    'education' as tabla, COUNT(*) as registros FROM education;

-- Si todas están vacías (COUNT = 0), proceder con la eliminación
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS experiencias;
DROP TABLE IF EXISTS education;

-- Verificar que las tablas principales existan
SHOW TABLES LIKE 'work_experience';
SHOW TABLES LIKE 'education_record';
```

---

## 📋 CRONOGRAMA DE IMPLEMENTACIÓN

| Fase | Duración | Dependencias | Riesgo |
|------|----------|--------------|--------|
| Fase 1: Servicios HTTP | 1 día | Ninguna | Bajo |
| Fase 2: Conectar Componente | 0.5 días | Fase 1 | Bajo |
| Fase 3: Sistema Archivos | 1 día | Fase 1-2 | Medio |
| Fase 4: Limpieza BD | 0.5 días | Fase 1-2 | Bajo |

**Total estimado:** 3 días

---

## 📋 CHECKLIST DE VALIDACIÓN

### Antes de empezar
- [ ] Backend funcionando en localhost:8082
- [ ] Frontend funcionando en localhost:4200
- [ ] Base de datos MySQL accesible
- [ ] Tablas work_experience y education_record existentes

### Después de Fase 1
- [ ] ExperienceCvService creado y compilando
- [ ] EducationCvService creado y compilando
- [ ] CvStateService creado y compilando
- [ ] Servicios exportados en index.ts

### Después de Fase 2
- [ ] Componente CV conectado a servicios reales
- [ ] Eliminada simulación de datos
- [ ] Datos se cargan desde backend
- [ ] Datos persisten al cambiar pestañas

### Después de Fase 3
- [ ] Carpetas de documentos CV creadas
- [ ] Upload de documentos funcional
- [ ] Archivos organizados por usuario

### Después de Fase 4
- [ ] Tablas redundantes eliminadas
- [ ] Solo work_experience y education_record activas
- [ ] Sistema funcionando sin errores

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Incompatibilidad de DTOs
**Mitigación:** Validar DTOs del backend vs modelos del frontend antes de implementar

### Riesgo 2: Errores de CORS
**Mitigación:** Verificar configuración CORS en application-dev.properties

### Riesgo 3: Pérdida de datos durante limpieza BD
**Mitigación:** Verificar que tablas estén vacías antes de eliminar

### Riesgo 4: Problemas de autenticación
**Mitigación:** Verificar que JWT tokens se envíen correctamente en headers

---

## 🎯 CRITERIOS DE ÉXITO

1. ✅ **Persistencia Real:** Datos CV se guardan y cargan desde base de datos
2. ✅ **Sin Simulación:** Eliminado completamente `simulateDataLoad()`
3. ✅ **Upload Funcional:** Documentos probatorios se suben y almacenan
4. ✅ **Organización:** Archivos organizados por usuario en carpetas
5. ✅ **BD Limpia:** Solo 2 tablas para CV (work_experience, education_record)
6. ✅ **UX Consistente:** Datos persisten al navegar entre pestañas

**RESULTADO ESPERADO:** Sistema CV completamente funcional con persistencia real y gestión de documentos probatorios.
