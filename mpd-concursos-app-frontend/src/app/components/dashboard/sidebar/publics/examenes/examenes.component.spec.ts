import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamenesComponent } from './examenes.component';

describe('ExamenesComponent', () => {
  let component: ExamenesComponent;
  let fixture: ComponentFixture<ExamenesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamenesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
