import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarMultaComponent } from './agregar-multa';

describe('AgregarMulta', () => {
  let component: AgregarMultaComponent;
  let fixture: ComponentFixture<AgregarMultaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarMultaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarMultaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
