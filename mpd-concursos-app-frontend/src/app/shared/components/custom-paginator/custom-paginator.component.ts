import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CustomPageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-custom-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-paginator.component.html',
  styleUrl: './custom-paginator.component.scss'
})
export class CustomPaginatorComponent {
  @Input() length: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() pageIndex: number = 0;

  @Output() page = new EventEmitter<CustomPageEvent>();

  get totalPages(): number {
    return Math.ceil(this.length / this.pageSize);
  }

  onPreviousPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.emitPageEvent();
    }
  }

  onNextPage() {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.emitPageEvent();
    }
  }

  onPageSizeChange(event: Event) {
    const newSize = +(event.target as HTMLSelectElement).value;
    this.pageSize = newSize;
    this.pageIndex = 0;
    this.emitPageEvent();
  }

  private emitPageEvent() {
    this.page.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length
    });
  }
}
