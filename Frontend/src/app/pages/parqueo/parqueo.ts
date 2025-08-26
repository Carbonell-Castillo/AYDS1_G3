// src/app/pages/parqueo/parqueo.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingService, EspacioOcupado, ParqueoConfig } from '../../services/parking';
import { VehiclesService, Vehiculo } from '../../services/vehicles';
import { SessionService } from '../../services/session';
import { Router } from '@angular/router';

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
interface Row { left?: Spot; right?: Spot; }
interface Bay { index: number; rows: Row[]; }

@Component({
  selector: 'app-parqueo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parqueo.html',
  styleUrl: './parqueo.css',
})
export class Parqueo implements OnInit {
  constructor(
    private parking: ParkingService,
    private vehiclesService: VehiclesService,
    private session: SessionService,
    private router: Router
  ) {}


  parqueoNombre = 'Parqueo';
  parqueoId = '';
  config = {
    // Se rellenan tras cargar configuración
    carTotal: 0,
    carBays: 4,        
    colsPerBay: 2,
    motoTotal: 0,
    motoBays: 2,
    motoColsPerBay: 2,
  };

  carSpots: Spot[] = [];
  motoSpots: Spot[] = [];
  carBays: Bay[] = [];
  motoBays: Bay[] = [];

  loading = false;
  errorMsg: string | null = null;

  async ngOnInit() {
    const user = this.session.getUser();
    const dpi = this.session.getDpi();
    if (!user || !dpi) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.parqueoId = user.id_parqueo ?? ''; 
    console.log('Parqueo ID:', this.parqueoId);
    this.loading = true;

    
    this.parking.getConfiguracionParqueo(this.parqueoId).subscribe({
      next: (cfg: ParqueoConfig) => {
        this.parqueoNombre = cfg?.nombre || 'Parqueo';
        this.config.carTotal = cfg?.cantidad_vehiculos ?? 0;
        this.config.motoTotal = cfg?.cantidad_motocicletas ?? 0;

    
        this.buildCars();
        this.buildMotos();

  
        this.loadOccupiedAndApply();

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudo cargar la configuración del parqueo.';
        this.loading = false;
      }
    });
  }

  
  private loadOccupiedAndApply() {
    this.parking.getEspaciosOcupados().subscribe({
      next: (list) => {
        // filtra por el parqueo del usuario 
        const filtered = list.filter(e => (e.nombreParqueo || '').toLowerCase() === this.parqueoNombre.toLowerCase());
        this.applyOccupiedFromApi(filtered);
      },
      error: (err) => console.error('Error ocupados:', err)
    });
  }


  private applyOccupiedFromApi(espacios: EspacioOcupado[]) {
    const carMax = this.config.carTotal;
    for (const e of espacios) {
      if (e.tipo_vehiculo_id === 2) {
        const s = this.motoSpots.find(sp => sp.id === e.idEspacio);
        if (s) { s.occupied = true; s.selected = false; }
      } else {

        const s = this.carSpots.find(sp => sp.id === e.idEspacio);
        if (s) { s.occupied = true; s.selected = false; }
    }
    }
  }


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
          const id = this.config.carTotal + leftIdx; 
          row.left = this.makeMotoSpot(id, leftIdx, 0);
          this.motoSpots.push(row.left);
        }

        const rightIdx = this.calcMotoIdx(r, b, 1);
        if (rightIdx <= motoTotal) {
          const id = this.config.carTotal + rightIdx;
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
    return rowIdx * columnsTotal + (bayIdx * colsPerBay + (side + 1)) + 1; // 1..carTotal
  }

  private calcMotoIdx(rowIdx: number, bayIdx: number, side: Side) {
    const { motoBays, motoColsPerBay } = this.config;
    const columnsTotal = motoBays * motoColsPerBay;
    return rowIdx * columnsTotal + (bayIdx * motoColsPerBay + (side + 1)) + 1; // 1..motoTotal (idx local)
  }

  private makeCarSpot(id: number, rowIdx: number, bayIdx: number, side: Side): Spot {
    const label = `${String.fromCharCode(65 + rowIdx)}${(bayIdx * this.config.colsPerBay) + (side + 1)}`;
    return { id, label, occupied: false, selected: false, side, kind: 'car' };
  }

  private makeMotoSpot(globalId: number, idxLocal: number, side: Side): Spot {
    const label = `M${String(idxLocal).padStart(2, '0')}`;
    return { id: globalId, label, occupied: false, selected: false, side, kind: 'moto' };
  }


  toggleCar(spot: Spot, ev: MouseEvent) {
    if (spot.occupied) { alert(`El espacio de auto ${spot.label} ya está ocupado.`); return; }
    this.selectVehicleAndAssign(spot, ev);
  }

  toggleMoto(spot: Spot, ev: MouseEvent) {
    if (spot.occupied) { alert(`El espacio de moto ${spot.label} ya está ocupado.`); return; }
    this.selectVehicleAndAssign(spot, ev);
  }

  private selectVehicleAndAssign(spot: Spot, ev: MouseEvent) {
    this.setRipple(ev);

    const dpi = this.session.getDpi();
    const user = this.session.getUser();
    if (!dpi || !user) { this.router.navigateByUrl('/login'); return; }


    this.vehiclesService.getVehiculosUsuario(dpi).subscribe({
      next: (vehiculos: Vehiculo[]) => {
        const list = vehiculos.filter(v => {
          console.log("Vehículo:", v);
          const t = Number(v.tipo_vehiculo_id);
          console.log("Tipo de vehículo:", t);
          return spot.kind === 'moto' ? t == 2 : t == 1;
        });

        if (!list.length) {
          alert(`No tienes ${spot.kind === 'moto' ? 'motocicletas' : 'vehículos'} registrados para este tipo de espacio.`);
          return;
        }

        let chosen: Vehiculo | null = null;
        if (list.length === 1) {
          chosen = list[0];
        } else {
          const menu = list.map((v, i) => `${i+1}) ${v.marca ?? ''} ${v.modelo ?? ''} (${v.placa})`).join('\n');
          const ans = window.prompt(`Elige el vehículo para parquear en ${spot.label}:\n${menu}\n\nEscribe el número:`);
          const idx = ans ? Number(ans) - 1 : -1;
          if (idx < 0 || idx >= list.length) return;
          chosen = list[idx];
        }

        if (!chosen) return;

        this.parking.asignarParqueoManual({
          usuario: dpi,
          placa: chosen.placa,
          idParqueo: this.parqueoId,
          idEspacio: spot.id
        }).subscribe({
          next: (res) => {
            alert(res.body?.mensaje || 'Parqueado exitosamente');
 
            spot.selected = false;
            spot.occupied = true;
          },
          error: (err) => {
            console.error(err);
            alert('No se pudo asignar el parqueo.');
          }
        });
      },
      error: (err) => {
        console.error(err);
        alert('No se pudieron cargar tus vehículos.');
      }
    });
  }

  clearAll() {
    this.carSpots.forEach(s => s.selected = false);
    this.motoSpots.forEach(s => s.selected = false);
  }

  confirmAll() {

    alert('Ahora la asignación se hace al elegir vehículo.');
  }

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

  carColor(id: number) {
    return (id % 5 === 0) ? 'blue' : (id % 2 === 0 ? 'red' : 'white');
  }

  toLetter(i: number): string {
    return String.fromCharCode(65 + i);
  }

asignar() {
  const dpi = this.session.getDpi();
  const user = this.session.getUser();
  if (!dpi || !user) {
    this.router.navigateByUrl('/login');
    return;
  }


  this.vehiclesService.getVehiculosUsuario(dpi).subscribe({
    next: (vehiculos: Vehiculo[]) => {
      if (!vehiculos.length) {
        alert('No tienes vehículos registrados. Registra uno primero.');
        return;
      }

      // 2) Elegir vehículo si hay varios
      let chosen: Vehiculo | null = null;
      if (vehiculos.length === 1) {
        chosen = vehiculos[0];
      } else {
        const menu = vehiculos
          .map((v, i) => `${i + 1}) ${v.marca ?? ''} ${v.modelo ?? ''} (${v.placa})`)
          .join('\n');
        const ans = window.prompt(`Elige el vehículo para parquear automáticamente:\n${menu}\n\nEscribe el número:`);
        const idx = ans ? Number(ans) - 1 : -1;
        if (idx < 0 || idx >= vehiculos.length) return;
        chosen = vehiculos[idx];
      }
      if (!chosen) return;

      // 3) Llamar a ASIGNACIÓN AUTOMÁTICA
      this.parking.asignarParqueoAutomatico({
        usuario: dpi,
        placa: chosen.placa
      }).subscribe({
        next: (res) => {
          const body = res.body;
          const idEspacio = body?.idEspacio ?? (body as any)?.id_espacio;
          if (!idEspacio) {
            alert(body?.mensaje || 'Parqueado, pero no se recibió el id del espacio.');
            return;
          }

          
          const isCar = idEspacio <= this.config.carTotal;
          const pool = isCar ? this.carSpots : this.motoSpots;
          const spot = pool.find(s => s.id === idEspacio);
          if (spot) {
            spot.selected = false;
            spot.occupied = true;
            alert(`${body?.mensaje || 'Parqueado exitosamente'} en ${spot.label}`);
          } else {
            
            alert(body?.mensaje || 'Parqueado exitosamente');
            this.loadOccupiedAndApply();
          }
        },
        error: (err) => {
          console.error(err);
          alert('No se pudo asignar automáticamente el parqueo.');
        }
      });
    },
    error: (err) => {
      console.error(err);
      alert('No se pudieron cargar tus vehículos.');
    }
  });
}

}
