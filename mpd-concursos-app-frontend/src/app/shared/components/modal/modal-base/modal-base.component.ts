/**
 * Componente Base de Modal Reutilizable
 * 
 * @description Modal base con funcionalidades comunes para todos los modales del sistema
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalType = 'default' | 'confirmation' | 'form' | 'info' | 'warning' | 'error';

export interface ModalConfig {
  title: string;
  size: ModalSize;
  type: ModalType;
  closable: boolean;
  backdrop: boolean;
  keyboard: boolean;
  centered: boolean;
  scrollable: boolean;
  showHeader: boolean;
  showFooter: boolean;
  customClass?: string;
}

@Component({
  selector: 'app-modal-base',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-base.component.html',
  styleUrls: ['./modal-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modalAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.8) translateY(-100px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      transition('void => *', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('* => void', animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('backdropAnimation', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('200ms ease-in')),
      transition('* => void', animate('150ms ease-out'))
    ])
  ]
})
export class ModalBaseComponent implements OnInit, OnDestroy {

  // ===== INPUTS =====
  @Input() isOpen = false;
  @Input() config: Partial<ModalConfig> = {};

  // ===== OUTPUTS =====
  @Output() close = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  // ===== SIGNALS =====
  public readonly modalConfig = signal<ModalConfig>({
    title: '',
    size: 'md',
    type: 'default',
    closable: true,
    backdrop: true,
    keyboard: true,
    centered: true,
    scrollable: false,
    showHeader: true,
    showFooter: true
  });

  // ===== COMPUTED SIGNALS =====
  public readonly modalClasses = computed(() => {
    const config = this.modalConfig();
    return {
      [`modal-${config.size}`]: true,
      [`modal-${config.type}`]: true,
      'modal-centered': config.centered,
      'modal-scrollable': config.scrollable,
      [config.customClass || '']: !!config.customClass
    };
  });

  public readonly canClose = computed(() => this.modalConfig().closable);

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.updateConfig();
    if (this.isOpen) {
      this.onModalOpened();
    }
  }

  ngOnDestroy(): void {
    this.onModalClosed();
  }

  // ===== EVENT HANDLERS =====

  /**
   * Maneja el clic en el backdrop
   */
  onBackdropClick(event: Event): void {
    if (!this.modalConfig().backdrop || !this.canClose()) return;
    
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  /**
   * Maneja el clic en el botón de cerrar
   */
  onCloseClick(): void {
    if (this.canClose()) {
      this.closeModal();
    }
  }

  /**
   * Maneja las teclas del teclado
   */
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen || !this.modalConfig().keyboard) return;

    switch (event.key) {
      case 'Escape':
        if (this.canClose()) {
          this.closeModal();
        }
        break;
    }
  }

  // ===== PUBLIC METHODS =====

  /**
   * Abre el modal
   */
  openModal(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.onModalOpened();
    }
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.close.emit();
      this.onModalClosed();
    }
  }

  /**
   * Actualiza la configuración del modal
   */
  updateConfig(newConfig?: Partial<ModalConfig>): void {
    const currentConfig = this.modalConfig();
    const updatedConfig = { ...currentConfig, ...this.config, ...newConfig };
    this.modalConfig.set(updatedConfig);
  }

  // ===== PRIVATE METHODS =====

  /**
   * Maneja la apertura del modal
   */
  private onModalOpened(): void {
    document.body.classList.add('modal-open');
    this.opened.emit();
  }

  /**
   * Maneja el cierre del modal
   */
  private onModalClosed(): void {
    document.body.classList.remove('modal-open');
    this.closed.emit();
  }
}
