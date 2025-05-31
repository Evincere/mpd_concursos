import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocumentoUsuario } from '../../../../../core/models/documento.model';
import { DocumentoViewerAdminComponent } from '../documento-viewer-admin/documento-viewer-admin.component';

@Component({
  selector: 'app-documento-viewer-dialog',
  templateUrl: './documento-viewer-dialog.component.html',
  styleUrls: ['./documento-viewer-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DocumentoViewerAdminComponent
  ]
})
export class DocumentoViewerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DocumentoViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { documento: DocumentoUsuario }
  ) { }

  cerrar(): void {
    this.dialogRef.close();
  }
}
