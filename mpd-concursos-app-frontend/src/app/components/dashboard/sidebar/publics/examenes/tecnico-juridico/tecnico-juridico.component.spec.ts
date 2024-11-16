import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoJuridicoComponent } from './tecnico-juridico.component';

describe('TecnicoJuridicoComponent', () => {
  let component: TecnicoJuridicoComponent;
  let fixture: ComponentFixture<TecnicoJuridicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoJuridicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TecnicoJuridicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
