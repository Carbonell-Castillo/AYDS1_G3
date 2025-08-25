import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Tipos de ayuda */
type Side = 0 | 1;
type Kind = 'car' | 'moto';

interface Spot {
  id: number;
  label: string;
  occupied: boolean;
  selected: boolean;
  side: Side;
  kind: Kind;
}

interface Row {
  left?: Spot;
  right?: Spot;
}

interface Bay {
  index: number;
  rows: Row[];
}

@Component({
  selector: 'app-parqueo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parqueo.html',
  styleUrl: './parqueo.css',
})
export class Parqueo implements OnInit {

  config = {
    // AUTOS
    carTotal: 75,
    carBays: 4,
    colsPerBay: 2,
    // MOTOS
    motoTotal: 24,
    motoBays: 2,
    motoColsPerBay: 2,

    preOccupiedCarIds: [2, 3, 4, 5, 27],
    preOccupiedMotoIds: [1003, 1007, 1012],

    demoCarOccupied: 0,
    demoMotoOccupied: 0,
  };

  carSpots: Spot[] = [];
  motoSpots: Spot[] = [];

  carBays: Bay[] = [];
  motoBays: Bay[] = [];

  ngOnInit(): void {
    this.buildCars();
    this.buildMotos();
    this.applyPreOccupied();
  }

  /** Estructura */
  private buildCars() {
    this.carSpots = [];
    this.carBays = [];

    const { carTotal, carBays, colsPerBay } = this.config;
    const columnsTotal = carBays * colsPerBay;  
    const rows = Math.ceil(carTotal / columnsTotal);

    for (let b = 0; b < carBays; b++) {
      const bay: Bay = { index: b, rows: [] };

      for (let r = 0; r < rows; r++) {
        const row: Row = {};

        const leftId = this.calcCarId(r, b, 0);
        if (leftId <= carTotal) {
          row.left = this.makeCarSpot(leftId, r, b, 0);
          this.carSpots.push(row.left);
        }

        const rightId = this.calcCarId(r, b, 1);
        if (rightId <= carTotal) {
          row.right = this.makeCarSpot(rightId, r, b, 1);
          this.carSpots.push(row.right);
        }

        bay.rows.push(row);
      }
      this.carBays.push(bay);
    }
  }

  private buildMotos() {
    this.motoSpots = [];
    this.motoBays = [];

    const { motoTotal, motoBays, motoColsPerBay } = this.config;
    const columnsTotal = motoBays * motoColsPerBay;
    const rows = Math.ceil(motoTotal / columnsTotal);

    for (let b = 0; b < motoBays; b++) {
      const bay: Bay = { index: b, rows: [] };

      for (let r = 0; r < rows; r++) {
        const row: Row = {};

        const leftIdx = this.calcMotoIdx(r, b, 0);
        if (leftIdx <= motoTotal) {
          const id = 1000 + leftIdx;
          row.left = this.makeMotoSpot(id, leftIdx, 0);
          this.motoSpots.push(row.left);
        }

        const rightIdx = this.calcMotoIdx(r, b, 1);
        if (rightIdx <= motoTotal) {
          const id = 1000 + rightIdx;
          row.right = this.makeMotoSpot(id, rightIdx, 1);
          this.motoSpots.push(row.right);
        }

        bay.rows.push(row);
      }
      this.motoBays.push(bay);
    }
  }

  private calcCarId(rowIdx: number, bayIdx: number, side: Side) {
    const { carBays, colsPerBay } = this.config;
    const columnsTotal = carBays * colsPerBay;
    return rowIdx * columnsTotal + (bayIdx * colsPerBay + (side + 1)) + 1;
  }

  private calcMotoIdx(rowIdx: number, bayIdx: number, side: Side) {
    const { motoBays, motoColsPerBay } = this.config;
    const columnsTotal = motoBays * motoColsPerBay;
    return rowIdx * columnsTotal + (bayIdx * motoColsPerBay + (side + 1)) + 1;
  }

  private makeCarSpot(id: number, rowIdx: number, bayIdx: number, side: Side): Spot {
    const label = `${String.fromCharCode(65 + rowIdx)}${(bayIdx * this.config.colsPerBay) + (side + 1)}`;
    return { id, label, occupied: false, selected: false, side, kind: 'car' };
  }

  private makeMotoSpot(id: number, idx: number, side: Side): Spot {
    const label = `M${String(idx).padStart(2, '0')}`;
    return { id, label, occupied: false, selected: false, side, kind: 'moto' };
  }

  /** Pre-ocupar y demo */
  private applyPreOccupied() {
    const { preOccupiedCarIds, preOccupiedMotoIds, demoCarOccupied, demoMotoOccupied } = this.config;

    if (Array.isArray(preOccupiedCarIds) && preOccupiedCarIds.length) {
      this.setOccupiedList(preOccupiedCarIds, /*isMoto*/ false);
    } else if (demoCarOccupied > 0) {
      const ids = [...this.carSpots].sort(() => Math.random() - 0.5).slice(0, demoCarOccupied).map(s => s.id);
      this.setOccupiedList(ids, false);
    }

    if (Array.isArray(preOccupiedMotoIds) && preOccupiedMotoIds.length) {
      this.setOccupiedList(preOccupiedMotoIds, /*isMoto*/ true);
    } else if (demoMotoOccupied > 0) {
      const ids = [...this.motoSpots].sort(() => Math.random() - 0.5).slice(0, demoMotoOccupied).map(s => s.id);
      this.setOccupiedList(ids, true);
    }
  }

  private setOccupiedList(ids: number[], isMoto: boolean) {
    const pool = isMoto ? this.motoSpots : this.carSpots;
    ids.forEach(id => {
      const spot = pool.find(s => s.id === id);
      if (!spot) return;
      spot.occupied = true;
      spot.selected = false;
    });
  }

  /** Interacciones */
  toggleCar(spot: Spot, ev: MouseEvent) {
    if (spot.occupied) { alert(`El espacio de auto ${spot.label} ya está ocupado.`); return; }
    this.setRipple(ev);
    spot.selected = !spot.selected;
  }

  toggleMoto(spot: Spot, ev: MouseEvent) {
    if (spot.occupied) { alert(`El espacio de moto ${spot.label} ya está ocupado.`); return; }
    this.setRipple(ev);
    spot.selected = !spot.selected;
  }

  clearAll() {
    this.carSpots.forEach(s => s.selected = false);
    this.motoSpots.forEach(s => s.selected = false);
  }

  confirmAll() {
    const carIds = this.carSpots.filter(s => s.selected).map(s => s.id);
    const motoIds = this.motoSpots.filter(s => s.selected).map(s => s.id);
    alert(`Confirmado:\nAutos: [${carIds.join(', ')}]\nMotos: [${motoIds.join(', ')}]`);
  }

  /** Ripple: setea --x y --y en el botón (currentTarget) */
  private setRipple(ev: MouseEvent) {
    const btn = ev.currentTarget as HTMLElement | null;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--x', `${ev.clientX - rect.left}px`);
    btn.style.setProperty('--y', `${ev.clientY - rect.top}px`);
  }

  get carsSelected() { return this.carSpots.filter(s => s.selected).length; }
  get carsOccupied() { return this.carSpots.filter(s => s.occupied).length; }
  get carsFilled()   { return this.carsSelected + this.carsOccupied; }
  get carsEmpty()    { return this.config.carTotal - this.carsFilled; }

  get motosSelected() { return this.motoSpots.filter(s => s.selected).length; }
  get motosOccupied() { return this.motoSpots.filter(s => s.occupied).length; }
  get motosFilled()   { return this.motosSelected + this.motosOccupied; }
  get motosEmpty()    { return this.config.motoTotal - this.motosFilled; }

  /** Color del auto (igual que tu JS) */
  carColor(id: number) {
    return (id % 5 === 0) ? 'blue' : (id % 2 === 0 ? 'red' : 'white');
  }

    toLetter(i: number): string {
    return String.fromCharCode(65 + i);
  }

}
