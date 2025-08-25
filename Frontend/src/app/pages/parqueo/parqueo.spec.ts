import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Parqueo } from './parqueo';

describe('Parqueo', () => {
  let component: Parqueo;
  let fixture: ComponentFixture<Parqueo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Parqueo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Parqueo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
