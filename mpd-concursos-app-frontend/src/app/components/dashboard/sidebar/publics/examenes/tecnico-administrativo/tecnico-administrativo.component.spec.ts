import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoAdministrativoComponent } from './tecnico-administrativo.component';

describe('TecnicoAdministrativoComponent', () => {
  let component: TecnicoAdministrativoComponent;
  let fixture: ComponentFixture<TecnicoAdministrativoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoAdministrativoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TecnicoAdministrativoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
