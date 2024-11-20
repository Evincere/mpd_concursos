import { Observable } from 'rxjs';

export interface ISearchService {
  search(term: string): void;
  getSearchTerm(): Observable<string>;
  isLoading(): Observable<boolean>;
  clearSearch(): void;
} 