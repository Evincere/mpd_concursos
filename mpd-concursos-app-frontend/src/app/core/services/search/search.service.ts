import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ISearchService } from '@shared/interfaces/services/search-service.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchService implements ISearchService {
  private searchTermSubject = new BehaviorSubject<string>('');
  private loadingSubject = new BehaviorSubject<boolean>(false);

  private searchTerm$ = this.searchTermSubject.asObservable();
  private loading$ = this.loadingSubject.asObservable();

  constructor() { }

  search(term: string): void {
    this.loadingSubject.next(true);
    this.searchTermSubject.next(term);
  }

  getSearchTerm(): Observable<string> {
    return this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term => {
        this.loadingSubject.next(false);
        return term;
      })
    );
  }

  isLoading(): Observable<boolean> {
    return this.loading$;
  }

  clearSearch(): void {
    this.searchTermSubject.next('');
    this.loadingSubject.next(false);
  }
} 