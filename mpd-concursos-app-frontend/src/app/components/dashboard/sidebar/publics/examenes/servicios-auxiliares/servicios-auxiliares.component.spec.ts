import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosAuxiliaresComponent } from './servicios-auxiliares.component';

describe('ServiciosAuxiliaresComponent', () => {
  let component: ServiciosAuxiliaresComponent;
  let fixture: ComponentFixture<ServiciosAuxiliaresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosAuxiliaresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosAuxiliaresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
