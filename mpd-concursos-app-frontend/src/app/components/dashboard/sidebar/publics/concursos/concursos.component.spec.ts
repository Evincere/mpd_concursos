import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcursosComponent } from './concursos.component';

describe('ConcursosComponent', () => {
  let component: ConcursosComponent;
  let fixture: ComponentFixture<ConcursosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcursosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
