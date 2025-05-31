# Contest Status Badge Component

A comprehensive, reusable badge system for displaying contest status indicators throughout the application with consistent glassmorphism design and Spanish localization.

## Features

- ✅ **Glassmorphism Design**: Consistent with the application's design system
- ✅ **Spanish Localization**: All status labels in Spanish
- ✅ **Semantic Color Coding**: Intuitive colors for each status
- ✅ **WCAG AA Compliance**: Proper contrast ratios for accessibility
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **Icon Support**: Optional FontAwesome icons for each status
- ✅ **Hover Effects**: Subtle animations and visual feedback
- ✅ **TypeScript Support**: Full type safety with interfaces

## Status Definitions

| Status | Spanish Label | Color | Icon | Description |
|--------|---------------|-------|------|-------------|
| `ACTIVE` | Activo | Green (#10b981) | `fa-play-circle` | Contest is currently active and accepting applications |
| `DRAFT` | Borrador | Amber (#f59e0b) | `fa-edit` | Contest is in draft mode, not yet published |
| `IN_PROGRESS` | En Progreso | Blue (#3b82f6) | `fa-clock` | Contest is running but no longer accepting applications |
| `CLOSED` | Cerrado | Red (#ef4444) | `fa-times-circle` | Contest has ended and is closed |
| `CANCELLED` | Cancelado | Gray (#6b7280) | `fa-ban` | Contest has been cancelled |

## Usage

### Basic Usage

```html
<app-contest-status-badge 
  [status]="'ACTIVE'"
  [showIcon]="true">
</app-contest-status-badge>
```

### In Tables

```html
<td>
  <app-contest-status-badge 
    [status]="concurso.estado"
    [showIcon]="true">
  </app-contest-status-badge>
</td>
```

### Without Icons

```html
<app-contest-status-badge 
  [status]="contest.status"
  [showIcon]="false">
</app-contest-status-badge>
```

## Component API

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `status` | `ContestStatus \| string` | `'DRAFT'` | The contest status to display |
| `showIcon` | `boolean` | `true` | Whether to show the status icon |

### ContestStatus Type

```typescript
export type ContestStatus = 'ACTIVE' | 'CLOSED' | 'IN_PROGRESS' | 'DRAFT' | 'CANCELLED';
```

## Service Integration

The component works with the `ContestStatusService` for centralized status management:

```typescript
import { ContestStatusService } from '@shared/services/contest-status.service';

constructor(private contestStatusService: ContestStatusService) {}

// Get status label
getLabel(status: string): string {
  return this.contestStatusService.getStatusLabel(status);
}

// Check if status is active
isActive(status: string): boolean {
  return this.contestStatusService.isActiveStatus(status);
}
```

## Styling

The component uses glassmorphism effects with:
- Backdrop blur filters
- Subtle gradient overlays
- Semi-transparent backgrounds
- Smooth hover transitions
- Consistent border radius (8px)

### CSS Classes

Each status generates a CSS class for custom styling:
- `.status-active`
- `.status-draft`
- `.status-in_progress`
- `.status-closed`
- `.status-cancelled`
- `.status-unknown` (fallback)

## Accessibility

- **ARIA Labels**: Proper `aria-label` attributes
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Keyboard Navigation**: Focusable when needed
- **Screen Readers**: Semantic markup and labels

## Integration Examples

### Recent Contests Table
```html
<tr *ngFor="let concurso of recentConcursos">
  <td>{{concurso.titulo}}</td>
  <td>{{concurso.fecha | date:'dd/MM/yyyy'}}</td>
  <td>
    <app-contest-status-badge 
      [status]="concurso.estado"
      [showIcon]="true">
    </app-contest-status-badge>
  </td>
</tr>
```

### Admin Contest List
```html
<app-contest-status-badge 
  [status]="contest.status"
  [showIcon]="false">
</app-contest-status-badge>
```

### Contest Detail View
```html
<div class="contest-header">
  <h1>{{contest.title}}</h1>
  <app-contest-status-badge 
    [status]="contest.status"
    [showIcon]="true">
  </app-contest-status-badge>
</div>
```

## Migration from Old Status Display

Replace old status spans:
```html
<!-- OLD -->
<span class="status" [class.active]="concurso.estado === 'Activo'">
  {{concurso.estado}}
</span>

<!-- NEW -->
<app-contest-status-badge 
  [status]="concurso.estado"
  [showIcon]="true">
</app-contest-status-badge>
```

## Browser Support

- Modern browsers with CSS backdrop-filter support
- Graceful degradation for older browsers
- Mobile-responsive design
- Touch-friendly hover states

## Dependencies

- Angular 17+
- FontAwesome icons (for icon display)
- CSS backdrop-filter support (optional, graceful degradation)
