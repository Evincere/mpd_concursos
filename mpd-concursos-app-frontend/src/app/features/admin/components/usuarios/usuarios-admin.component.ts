import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  estado: 'activo' | 'inactivo' | 'bloqueado';
  fechaRegistro: Date;
  ultimoAcceso: Date | null;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-usuarios-admin',
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ]
})
export class UsuariosAdminComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nombre', 'email', 'roles', 'estado', 'fechaRegistro', 'ultimoAcceso', 'acciones'];
  dataSource: MatTableDataSource<Usuario>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos hardcodeados para la demostración
  usuarios: Usuario[] = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan.perez@example.com',
      roles: ['admin', 'evaluador'],
      estado: 'activo',
      fechaRegistro: new Date(2023, 0, 15),
      ultimoAcceso: new Date(2023, 5, 10, 14, 30),
      telefono: '11-1234-5678',
      direccion: 'Av. Corrientes 1234, CABA'
    },
    {
      id: 2,
      nombre: 'María López',
      email: 'maria.lopez@example.com',
      roles: ['usuario'],
      estado: 'activo',
      fechaRegistro: new Date(2023, 1, 20),
      ultimoAcceso: new Date(2023, 5, 9, 10, 15),
      telefono: '11-2345-6789',
      direccion: 'Av. Santa Fe 4321, CABA'
    },
    {
      id: 3,
      nombre: 'Carlos Gómez',
      email: 'carlos.gomez@example.com',
      roles: ['evaluador'],
      estado: 'inactivo',
      fechaRegistro: new Date(2023, 2, 5),
      ultimoAcceso: new Date(2023, 4, 20, 9, 45),
      telefono: '11-3456-7890',
      direccion: 'Av. Cabildo 2468, CABA'
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@example.com',
      roles: ['usuario'],
      estado: 'bloqueado',
      fechaRegistro: new Date(2023, 3, 10),
      ultimoAcceso: new Date(2023, 4, 15, 16, 20),
      telefono: '11-4567-8901',
      direccion: 'Av. Rivadavia 9876, CABA'
    },
    {
      id: 5,
      nombre: 'Roberto Sánchez',
      email: 'roberto.sanchez@example.com',
      roles: ['usuario'],
      estado: 'activo',
      fechaRegistro: new Date(2023, 4, 25),
      ultimoAcceso: null,
      telefono: '11-5678-9012',
      direccion: 'Av. Belgrano 1357, CABA'
    }
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource(this.usuarios);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  crearUsuario() {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Simular creación de usuario
        const nuevoUsuario: Usuario = {
          id: this.usuarios.length + 1,
          nombre: result.nombre,
          email: result.email,
          roles: result.roles,
          estado: 'activo',
          fechaRegistro: new Date(),
          ultimoAcceso: null,
          telefono: result.telefono || '',
          direccion: result.direccion || ''
        };

        this.usuarios.push(nuevoUsuario);
        this.dataSource.data = this.usuarios;
        this.snackBar.open('Usuario creado correctamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editarUsuario(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '600px',
      data: { mode: 'edit', usuario }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Simular edición de usuario
        const index = this.usuarios.findIndex(u => u.id === usuario.id);
        if (index !== -1) {
          this.usuarios[index] = {
            ...this.usuarios[index],
            nombre: result.nombre,
            email: result.email,
            roles: result.roles,
            telefono: result.telefono || '',
            direccion: result.direccion || ''
          };
          this.dataSource.data = this.usuarios;
          this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  cambiarEstado(usuario: Usuario, nuevoEstado: 'activo' | 'inactivo' | 'bloqueado') {
    // Simular cambio de estado
    const index = this.usuarios.findIndex(u => u.id === usuario.id);
    if (index !== -1) {
      this.usuarios[index].estado = nuevoEstado;
      this.dataSource.data = this.usuarios;
      this.snackBar.open(`Estado del usuario cambiado a ${nuevoEstado}`, 'Cerrar', { duration: 3000 });
    }
  }

  eliminarUsuario(usuario: Usuario) {
    if (confirm(`¿Está seguro de eliminar al usuario ${usuario.nombre}?`)) {
      // Simular eliminación de usuario
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      this.dataSource.data = this.usuarios;
      this.snackBar.open('Usuario eliminado correctamente', 'Cerrar', { duration: 3000 });
    }
  }

  getRolText(rol: string): string {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'evaluador': return 'Evaluador';
      case 'usuario': return 'Usuario';
      default: return rol;
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'activo': return 'estado-activo';
      case 'inactivo': return 'estado-inactivo';
      case 'bloqueado': return 'estado-bloqueado';
      default: return '';
    }
  }
}
