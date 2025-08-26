import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarVehiculos } from './agregar-vehiculos';

describe('AgregarVehiculos', () => {
  let component: AgregarVehiculos;
  let fixture: ComponentFixture<AgregarVehiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarVehiculos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarVehiculos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
