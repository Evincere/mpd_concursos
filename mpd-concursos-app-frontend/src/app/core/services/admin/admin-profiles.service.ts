import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from  '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { TokenService } from '@core/services/auth/token.service';
import { environment } from '../../../../environments/environment';


export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dni?: string;
  cuit?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  address?: {
    street?: string;
    number?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  centroDeVida?: {
    street?: string;
    number?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  professionalInfo?: {
    title?: string;
    specialization?: string;
    licenseNumber?: string;
    graduationDate?: string;
    university?: string;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    language?: string;
    accessibility?: {
      highContrast?: boolean;
      largeText?: boolean;
      screenReader?: boolean;
    };
  };
  documents?: {
    id: string;
    type: string;
    name: string;
    url: string;
    uploadDate: string;
    verified: boolean;
  }[];
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface ProfileFilter {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  hasDocuments?: boolean;
  hasProfessionalInfo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dni?: string;
  cuit?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  address?: {
    street?: string;
    number?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  centroDeVida?: {
    street?: string;
    number?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  professionalInfo?: {
    title?: string;
    specialization?: string;
    licenseNumber?: string;
    graduationDate?: string;
    university?: string;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    language?: string;
    accessibility?: {
      highContrast?: boolean;
      largeText?: boolean;
      screenReader?: boolean;
    };
  };
}

export interface ProfileStats {
  totalProfiles: number;
  completeProfiles: number;
  incompleteProfiles: number;
  byStatus: Record<string, number>;
  byDocumentType: Record<string, number>;
  byProfessionalTitle: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProfilesService {
  private apiUrl = `${environment.apiUrl}/admin/profiles`;

  constructor(private tokenService: TokenService) {}

  // Mock data for development
  private mockProfiles: UserProfile[] = [
    {
      id: '1',
      userId: '1',
      username: 'admin',
      firstName: 'Administrador',
      lastName: 'del Sistema',
      email: 'admin@example.com',
      phone: '+54 9 11 1234-5678',
      dni: '12345678',
      cuit: '20-12345678-9',
      birthDate: '1980-01-01',
      gender: 'Masculino',
      nationality: 'Argentina',
      address: {
        street: 'Av. Corrientes',
        number: '1234',
        floor: '5',
        apartment: 'B',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Buenos Aires',
        postalCode: '1043',
        country: 'Argentina',
        coordinates: {
          lat: -34.603722,
          lng: -58.381592
        }
      },
      centroDeVida: {
        street: 'Av. Corrientes',
        number: '1234',
        floor: '5',
        apartment: 'B',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Buenos Aires',
        postalCode: '1043',
        country: 'Argentina',
        coordinates: {
          lat: -34.603722,
          lng: -58.381592
        }
      },
      professionalInfo: {
        title: 'Abogado',
        specialization: 'Derecho Penal',
        licenseNumber: 'T° 123 F° 456',
        graduationDate: '2005-12-15',
        university: 'Universidad de Buenos Aires'
      },
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        language: 'es',
        accessibility: {
          highContrast: false,
          largeText: false,
          screenReader: false
        }
      },
      documents: [
        {
          id: '1',
          type: 'DNI',
          name: 'DNI.pdf',
          url: '/assets/mock/documents/dni.pdf',
          uploadDate: '2023-01-15T10:30:00Z',
          verified: true
        },
        {
          id: '2',
          type: 'TITULO',
          name: 'Titulo.pdf',
          url: '/assets/mock/documents/titulo.pdf',
          uploadDate: '2023-01-15T10:35:00Z',
          verified: true
        },
        {
          id: '3',
          type: 'CERTIFICADO_ANTECEDENTES',
          name: 'Certificado.pdf',
          url: '/assets/mock/documents/certificado.pdf',
          uploadDate: '2023-01-15T10:40:00Z',
          verified: true
        }
      ],
      avatar: '/assets/mock/avatars/admin.jpg',
      status: 'ACTIVE',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-06-15T14:30:00Z',
      lastLogin: '2023-07-01T08:45:00Z'
    },
    {
      id: '2',
      userId: '2',
      username: 'usuario1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      phone: '+54 9 11 8765-4321',
      dni: '87654321',
      cuit: '20-87654321-9',
      birthDate: '1985-05-10',
      gender: 'Masculino',
      nationality: 'Argentina',
      address: {
        street: 'Av. Santa Fe',
        number: '4321',
        floor: '3',
        apartment: 'A',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Buenos Aires',
        postalCode: '1425',
        country: 'Argentina'
      },
      centroDeVida: {
        street: 'Av. Santa Fe',
        number: '4321',
        floor: '3',
        apartment: 'A',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Buenos Aires',
        postalCode: '1425',
        country: 'Argentina'
      },
      professionalInfo: {
        title: 'Abogado',
        specialization: 'Derecho Civil',
        licenseNumber: 'T° 456 F° 789',
        graduationDate: '2010-07-20',
        university: 'Universidad de Buenos Aires'
      },
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        language: 'es'
      },
      documents: [
        {
          id: '4',
          type: 'DNI',
          name: 'DNI.pdf',
          url: '/assets/mock/documents/dni2.pdf',
          uploadDate: '2023-02-10T09:15:00Z',
          verified: true
        },
        {
          id: '5',
          type: 'TITULO',
          name: 'Titulo.pdf',
          url: '/assets/mock/documents/titulo2.pdf',
          uploadDate: '2023-02-10T09:20:00Z',
          verified: true
        }
      ],
      avatar: '/assets/mock/avatars/user1.jpg',
      status: 'ACTIVE',
      createdAt: '2023-02-01T00:00:00Z',
      updatedAt: '2023-06-20T11:45:00Z',
      lastLogin: '2023-06-30T16:20:00Z'
    },
    {
      id: '3',
      userId: '3',
      username: 'usuario2',
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@example.com',
      phone: '+54 9 11 5555-5555',
      dni: '23456789',
      birthDate: '1990-12-15',
      gender: 'Femenino',
      nationality: 'Argentina',
      address: {
        street: 'Av. Rivadavia',
        number: '5678',
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Buenos Aires',
        postalCode: '1406',
        country: 'Argentina'
      },
      professionalInfo: {
        title: 'Abogada',
        specialization: 'Derecho Laboral',
        licenseNumber: 'T° 789 F° 123',
        graduationDate: '2015-03-25',
        university: 'Universidad de La Plata'
      },
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          sms: true
        },
        language: 'es'
      },
      documents: [
        {
          id: '6',
          type: 'DNI',
          name: 'DNI.pdf',
          url: '/assets/mock/documents/dni3.pdf',
          uploadDate: '2023-03-05T14:10:00Z',
          verified: false
        }
      ],
      status: 'ACTIVE',
      createdAt: '2023-03-01T00:00:00Z',
      updatedAt: '2023-06-25T09:30:00Z',
      lastLogin: '2023-06-29T10:15:00Z'
    }
  ];



  /**
   * Get user profiles with filters and pagination
   * @param filters Filters to apply
   */
  getProfiles(filters: ProfileFilter = {}): Observable<{ profiles: UserProfile[], total: number }> {
    // In a real app, this would call the API
    // return this.http.get<{ profiles: UserProfile[], total: number }>(
    //   this.apiUrl,
    //   { params: this.buildParams(filters), headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching profiles:', error);
    //     return of({ profiles: [], total: 0 });
    //   })
    // );

    // Mock implementation
    let filteredProfiles = [...this.mockProfiles];

    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredProfiles = filteredProfiles.filter(profile =>
          profile.username.toLowerCase().includes(search) ||
          profile.firstName.toLowerCase().includes(search) ||
          profile.lastName.toLowerCase().includes(search) ||
          profile.email.toLowerCase().includes(search) ||
          (profile.dni && profile.dni.toLowerCase().includes(search))
        );
      }

      if (filters.status) {
        filteredProfiles = filteredProfiles.filter(profile => profile.status === filters.status);
      }

      if (filters.hasDocuments !== undefined) {
        filteredProfiles = filteredProfiles.filter(profile =>
          filters.hasDocuments ?
            (profile.documents && profile.documents.length > 0) :
            (!profile.documents || profile.documents.length === 0)
        );
      }

      if (filters.hasProfessionalInfo !== undefined) {
        filteredProfiles = filteredProfiles.filter(profile =>
          filters.hasProfessionalInfo ?
            !!profile.professionalInfo :
            !profile.professionalInfo
        );
      }

      // Sort
      if (filters.sort) {
        filteredProfiles.sort((a: unknown, b: unknown) => {
          const aValue = this.getNestedProperty(a, filters.sort!);
          const bValue = this.getNestedProperty(b, filters.sort!);

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filters.direction === 'desc'
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          }

          // Verificar que los valores son números antes de realizar operaciones aritméticas
          const numA = typeof aValue === 'number' ? aValue : 0;
          const numB = typeof bValue === 'number' ? bValue : 0;
          return filters.direction === 'desc' ? numB - numA : numA - numB;
        });
      }
    }

    // Pagination
    const page = filters?.page || 0;
    const size = filters?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedProfiles = filteredProfiles.slice(start, end);

    return of({
      profiles: paginatedProfiles,
      total: filteredProfiles.length
    });
  }

  /**
   * Get user profile by ID
   * @param profileId Profile ID
   */
  getProfileById(profileId: string): Observable<UserProfile> {
    // In a real app, this would call the API
    // return this.http.get<UserProfile>(
    //   `${this.apiUrl}/${profileId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching profile with ID ${profileId}:`, error);
    //     return throwError(() => new Error('Error al obtener el perfil de usuario'));
    //   })
    // );

    // Mock implementation
    const profile = this.mockProfiles.find(p => p.id === profileId);
    if (!profile) {
      return throwError(() => new Error(`Perfil con ID ${profileId} no encontrado`));
    }
    return of(profile);
  }

  /**
   * Get user profile by user ID
   * @param userId User ID
   */
  getProfileByUserId(userId: string): Observable<UserProfile> {
    // In a real app, this would call the API
    // return this.http.get<UserProfile>(
    //   `${this.apiUrl}/user/${userId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching profile for user ID ${userId}:`, error);
    //     return throwError(() => new Error('Error al obtener el perfil de usuario'));
    //   })
    // );

    // Mock implementation
    const profile = this.mockProfiles.find(p => p.userId === userId);
    if (!profile) {
      return throwError(() => new Error(`Perfil para usuario con ID ${userId} no encontrado`));
    }
    return of(profile);
  }

  /**
   * Update user profile
   * @param profileId Profile ID
   * @param data Update data
   */
  updateProfile(profileId: string, data: UpdateProfileRequest): Observable<UserProfile> {
    // In a real app, this would call the API
    // return this.http.put<UserProfile>(
    //   `${this.apiUrl}/${profileId}`,
    //   data,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error updating profile with ID ${profileId}:`, error);
    //     return throwError(() => new Error('Error al actualizar el perfil de usuario'));
    //   })
    // );

    // Mock implementation
    const index = this.mockProfiles.findIndex(p => p.id === profileId);
    if (index === -1) {
      return throwError(() => new Error(`Perfil con ID ${profileId} no encontrado`));
    }

    const updatedProfile = {
      ...this.mockProfiles[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.mockProfiles[index] = updatedProfile;

    return of(updatedProfile);
  }

  /**
   * Get profile statistics
   */
  getProfileStats(): Observable<ProfileStats> {
    // In a real app, this would call the API
    // return this.http.get<ProfileStats>(
    //   `${this.apiUrl}/stats`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching profile stats:', error);
    //     return of({
    //       totalProfiles: 0,
    //       completeProfiles: 0,
    //       incompleteProfiles: 0,
    //       byStatus: {},
    //       byDocumentType: {},
    //       byProfessionalTitle: {}
    //     });
    //   })
    // );

    // Mock implementation
    const stats: ProfileStats = {
      totalProfiles: this.mockProfiles.length,
      completeProfiles: 0,
      incompleteProfiles: 0,
      byStatus: {},
      byDocumentType: {},
      byProfessionalTitle: {}
    };

    // Count complete/incomplete profiles
    this.mockProfiles.forEach(profile => {
      const isComplete =
        !!profile.firstName &&
        !!profile.lastName &&
        !!profile.email &&
        !!profile.dni &&
        !!profile.address &&
        !!profile.professionalInfo &&
        !!profile.documents &&
        profile.documents.length > 0;

      if (isComplete) {
        stats.completeProfiles++;
      } else {
        stats.incompleteProfiles++;
      }

      // Count by status
      stats.byStatus[profile.status] = (stats.byStatus[profile.status] || 0) + 1;

      // Count by document type
      if (profile.documents) {
        profile.documents.forEach(doc => {
          stats.byDocumentType[doc.type] = (stats.byDocumentType[doc.type] || 0) + 1;
        });
      }

      // Count by professional title
      if (profile.professionalInfo?.title) {
        const title = profile.professionalInfo.title;
        stats.byProfessionalTitle[title] = (stats.byProfessionalTitle[title] || 0) + 1;
      }
    });

    return of(stats);
  }

  /**
   * Get nested property from object using dot notation
   * @param obj Object to get property from
   * @param path Path to property using dot notation (e.g. 'address.city')
   */
  private getNestedProperty(obj: unknown, path: string): unknown {
    return path.split('.').reduce<Record<string, unknown> | undefined>((prev, curr): Record<string, unknown> | undefined => {
      return prev && typeof prev === 'object' ? prev[curr] as Record<string, unknown> | undefined : undefined;
    }, obj as Record<string, unknown>);
  }

  private buildParams(filters?: ProfileFilter): HttpParams {
    let params = new HttpParams();

    if (!filters) return params;

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.hasDocuments !== undefined) params = params.set('hasDocuments', filters.hasDocuments.toString());
    if (filters.hasProfessionalInfo !== undefined) params = params.set('hasProfessionalInfo', filters.hasProfessionalInfo.toString());
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size) params = params.set('size', filters.size.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.direction) params = params.set('direction', filters.direction);

    return params;
  }

  private getHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
