import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { 
  TemplateVariablesService, 
  DynamicVariable, 
  VariableContext 
} from '@core/services/messaging/template-variables.service';
import { TemplateVariableSelectorComponent } from '../template-variable-selector/template-variable-selector.component';

/**
 * Modo del editor
 */
export type EditorMode = 'text' | 'html' | 'markdown';

/**
 * Herramienta del editor
 */
export interface EditorTool {
  id: string;
  label: string;
  icon: string;
  action: string;
  shortcut?: string;
  separator?: boolean;
  dropdown?: EditorToolOption[];
}

/**
 * Opción de herramienta
 */
export interface EditorToolOption {
  value: string;
  label: string;
  icon?: string;
}

/**
 * Estado del editor
 */
export interface EditorState {
  canUndo: boolean;
  canRedo: boolean;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontSize: string;
  fontFamily: string;
  textAlign: string;
  selectedText: string;
  cursorPosition: number;
}

/**
 * Componente editor avanzado de plantillas
 */
@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    TemplateVariableSelectorComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TemplateEditorComponent),
      multi: true
    }
  ]
})
export class TemplateEditorComponent implements OnInit, ControlValueAccessor {

  @Input() mode: EditorMode = 'text';
  @Input() placeholder = 'Escribe tu mensaje aquí...';
  @Input() allowedContexts: VariableContext[] = [];
  @Input() showToolbar = true;
  @Input() showVariableSelector = true;
  @Input() showPreview = true;
  @Input() minHeight = '200px';
  @Input() maxHeight = '500px';
  @Input() disabled = false;

  @Output() contentChanged = new EventEmitter<string>();
  @Output() variableInserted = new EventEmitter<DynamicVariable>();
  @Output() modeChanged = new EventEmitter<EditorMode>();

  @ViewChild('editor') editorRef?: ElementRef<HTMLTextAreaElement | HTMLDivElement>;
  @ViewChild('htmlEditor') htmlEditorRef?: ElementRef<HTMLDivElement>;

  // Estados del componente
  content = '';
  previewContent = '';
  showVariables = false;
  showPreviewPanel = false;
  editorState: EditorState = {
    canUndo: false,
    canRedo: false,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    fontSize: '14px',
    fontFamily: 'Arial',
    textAlign: 'left',
    selectedText: '',
    cursorPosition: 0
  };

  // Historial para deshacer/rehacer
  private history: string[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  // Control Value Accessor
  private onChange = (value: string) => {};
  private onTouched = () => {};

  // Herramientas del editor
  tools: EditorTool[] = [
    {
      id: 'undo',
      label: 'Deshacer',
      icon: 'fas fa-undo',
      action: 'undo',
      shortcut: 'Ctrl+Z'
    },
    {
      id: 'redo',
      label: 'Rehacer',
      icon: 'fas fa-redo',
      action: 'redo',
      shortcut: 'Ctrl+Y'
    },
    { id: 'separator1', label: '', icon: '', action: '', separator: true },
    {
      id: 'bold',
      label: 'Negrita',
      icon: 'fas fa-bold',
      action: 'bold',
      shortcut: 'Ctrl+B'
    },
    {
      id: 'italic',
      label: 'Cursiva',
      icon: 'fas fa-italic',
      action: 'italic',
      shortcut: 'Ctrl+I'
    },
    {
      id: 'underline',
      label: 'Subrayado',
      icon: 'fas fa-underline',
      action: 'underline',
      shortcut: 'Ctrl+U'
    },
    { id: 'separator2', label: '', icon: '', action: '', separator: true },
    {
      id: 'fontSize',
      label: 'Tamaño',
      icon: 'fas fa-text-height',
      action: 'fontSize',
      dropdown: [
        { value: '12px', label: 'Pequeño' },
        { value: '14px', label: 'Normal' },
        { value: '16px', label: 'Mediano' },
        { value: '18px', label: 'Grande' },
        { value: '20px', label: 'Muy grande' }
      ]
    },
    {
      id: 'textAlign',
      label: 'Alineación',
      icon: 'fas fa-align-left',
      action: 'textAlign',
      dropdown: [
        { value: 'left', label: 'Izquierda', icon: 'fas fa-align-left' },
        { value: 'center', label: 'Centro', icon: 'fas fa-align-center' },
        { value: 'right', label: 'Derecha', icon: 'fas fa-align-right' },
        { value: 'justify', label: 'Justificado', icon: 'fas fa-align-justify' }
      ]
    },
    { id: 'separator3', label: '', icon: '', action: '', separator: true },
    {
      id: 'variables',
      label: 'Variables',
      icon: 'fas fa-code',
      action: 'variables'
    },
    {
      id: 'preview',
      label: 'Vista previa',
      icon: 'fas fa-eye',
      action: 'preview'
    }
  ];

  // Modos disponibles
  modes: Array<{ value: EditorMode; label: string; icon: string }> = [
    { value: 'text', label: 'Texto', icon: 'fas fa-font' },
    { value: 'html', label: 'HTML', icon: 'fas fa-code' },
    { value: 'markdown', label: 'Markdown', icon: 'fab fa-markdown' }
  ];

  constructor(
    private templateVariablesService: TemplateVariablesService
  ) {}

  ngOnInit(): void {
    this.initializeEditor();
  }

  /**
   * Inicializa el editor
   */
  private initializeEditor(): void {
    this.addToHistory(this.content);
    this.updateEditorState();
  }

  /**
   * Ejecuta una acción del editor
   */
  executeAction(action: string, value?: string): void {
    switch (action) {
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'bold':
        this.toggleFormat('bold');
        break;
      case 'italic':
        this.toggleFormat('italic');
        break;
      case 'underline':
        this.toggleFormat('underline');
        break;
      case 'fontSize':
        this.setFontSize(value || '14px');
        break;
      case 'textAlign':
        this.setTextAlign(value || 'left');
        break;
      case 'variables':
        this.toggleVariableSelector();
        break;
      case 'preview':
        this.togglePreview();
        break;
    }
  }

  /**
   * Alterna formato de texto
   */
  private toggleFormat(format: string): void {
    if (this.mode === 'html' && this.htmlEditorRef) {
      document.execCommand(format, false);
      this.updateContent();
    } else if (this.editorRef) {
      // Para modo texto, insertar marcadores
      this.insertTextFormat(format);
    }
    this.updateEditorState();
  }

  /**
   * Inserta formato de texto en modo texto
   */
  private insertTextFormat(format: string): void {
    if (!this.editorRef) return;

    const textarea = this.editorRef.nativeElement as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
    }

    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    this.updateContentValue(newContent);
    
    // Posicionar cursor
    setTimeout(() => {
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    });
  }

  /**
   * Establece tamaño de fuente
   */
  private setFontSize(size: string): void {
    if (this.mode === 'html' && this.htmlEditorRef) {
      document.execCommand('fontSize', false, size);
      this.updateContent();
    }
    this.editorState.fontSize = size;
  }

  /**
   * Establece alineación de texto
   */
  private setTextAlign(align: string): void {
    if (this.mode === 'html' && this.htmlEditorRef) {
      document.execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1), false);
      this.updateContent();
    }
    this.editorState.textAlign = align;
  }

  /**
   * Deshacer
   */
  private undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const content = this.history[this.historyIndex];
      this.updateContentValue(content, false);
      this.updateEditorState();
    }
  }

  /**
   * Rehacer
   */
  private redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const content = this.history[this.historyIndex];
      this.updateContentValue(content, false);
      this.updateEditorState();
    }
  }

  /**
   * Agrega al historial
   */
  private addToHistory(content: string): void {
    // Remover entradas futuras si estamos en el medio del historial
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(content);
    
    // Limitar tamaño del historial
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Actualiza estado del editor
   */
  private updateEditorState(): void {
    this.editorState.canUndo = this.historyIndex > 0;
    this.editorState.canRedo = this.historyIndex < this.history.length - 1;

    if (this.mode === 'html') {
      this.editorState.isBold = document.queryCommandState('bold');
      this.editorState.isItalic = document.queryCommandState('italic');
      this.editorState.isUnderline = document.queryCommandState('underline');
    }
  }

  /**
   * Actualiza contenido
   */
  private updateContent(): void {
    if (this.mode === 'html' && this.htmlEditorRef) {
      const content = this.htmlEditorRef.nativeElement.innerHTML;
      this.updateContentValue(content);
    }
  }

  /**
   * Actualiza valor del contenido
   */
  private updateContentValue(content: string, addToHistory = true): void {
    this.content = content;
    this.onChange(content);
    this.contentChanged.emit(content);
    
    if (addToHistory) {
      this.addToHistory(content);
    }
    
    this.updatePreview();
  }

  /**
   * Actualiza vista previa
   */
  private updatePreview(): void {
    if (this.showPreviewPanel) {
      // Procesar variables para preview
      this.templateVariablesService.processTemplate(this.content, this.getSampleContext()).subscribe(
        result => {
          this.previewContent = result.processedContent;
        }
      );
    }
  }

  /**
   * Obtiene contexto de muestra para preview
   */
  private getSampleContext(): any {
    return {
      user: {
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        dni: '12345678'
      },
      contest: {
        title: 'Concurso de Ejemplo',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      system: {
        appName: 'MPD Concursos',
        supportEmail: 'soporte@mpdconcursos.gov.ar',
        currentDate: new Date()
      }
    };
  }

  /**
   * Cambia modo del editor
   */
  changeMode(mode: EditorMode): void {
    this.mode = mode;
    this.modeChanged.emit(mode);
    this.updateEditorState();
  }

  /**
   * Alterna selector de variables
   */
  toggleVariableSelector(): void {
    this.showVariables = !this.showVariables;
  }

  /**
   * Alterna vista previa
   */
  togglePreview(): void {
    this.showPreviewPanel = !this.showPreviewPanel;
    if (this.showPreviewPanel) {
      this.updatePreview();
    }
  }

  /**
   * Maneja selección de variable
   */
  onVariableSelected(variable: DynamicVariable): void {
    this.insertVariable(variable);
    this.showVariables = false;
  }

  /**
   * Inserta variable en el editor
   */
  private insertVariable(variable: DynamicVariable): void {
    const variableText = `{{${variable.key}}}`;
    
    if (this.mode === 'html' && this.htmlEditorRef) {
      document.execCommand('insertText', false, variableText);
      this.updateContent();
    } else if (this.editorRef) {
      const textarea = this.editorRef.nativeElement as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = textarea.value.substring(0, start) + variableText + textarea.value.substring(end);
      
      this.updateContentValue(newContent);
      
      // Posicionar cursor después de la variable
      setTimeout(() => {
        const newPosition = start + variableText.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      });
    }

    this.variableInserted.emit(variable);
  }

  /**
   * Maneja cambio de contenido
   */
  onContentChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement | HTMLDivElement;
    const content = target.textContent || target.innerHTML || '';
    this.updateContentValue(content);
  }

  /**
   * Maneja eventos de teclado
   */
  onKeyDown(event: KeyboardEvent): void {
    // Atajos de teclado
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case 'y':
          event.preventDefault();
          this.redo();
          break;
        case 'b':
          event.preventDefault();
          this.toggleFormat('bold');
          break;
        case 'i':
          event.preventDefault();
          this.toggleFormat('italic');
          break;
        case 'u':
          event.preventDefault();
          this.toggleFormat('underline');
          break;
      }
    }
  }

  /**
   * Obtiene ícono de herramienta activa
   */
  getToolIcon(tool: EditorTool): string {
    if (tool.id === 'textAlign') {
      const alignIcons = {
        left: 'fas fa-align-left',
        center: 'fas fa-align-center',
        right: 'fas fa-align-right',
        justify: 'fas fa-align-justify'
      };
      return alignIcons[this.editorState.textAlign as keyof typeof alignIcons] || tool.icon;
    }
    return tool.icon;
  }

  /**
   * Verifica si herramienta está activa
   */
  isToolActive(tool: EditorTool): boolean {
    switch (tool.id) {
      case 'bold':
        return this.editorState.isBold;
      case 'italic':
        return this.editorState.isItalic;
      case 'underline':
        return this.editorState.isUnderline;
      case 'variables':
        return this.showVariables;
      case 'preview':
        return this.showPreviewPanel;
      default:
        return false;
    }
  }

  /**
   * Verifica si herramienta está deshabilitada
   */
  isToolDisabled(tool: EditorTool): boolean {
    switch (tool.id) {
      case 'undo':
        return !this.editorState.canUndo;
      case 'redo':
        return !this.editorState.canRedo;
      default:
        return this.disabled;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
    this.updatePreview();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
