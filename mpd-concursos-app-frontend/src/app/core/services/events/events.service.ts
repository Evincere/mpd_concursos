import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum EventType {
  INSCRIPTION_CANCELLED = 'INSCRIPTION_CANCELLED',
  INSCRIPTION_CREATED = 'INSCRIPTION_CREATED'
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private events = new Subject<EventType>();

  events$ = this.events.asObservable();

  emit(event: EventType): void {
    this.events.next(event);
  }
} 