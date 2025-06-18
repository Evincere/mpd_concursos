
/**
 * CV Migration Routing Patch
 * Adds immediate access routes for CV migration
 */

// Add this to your main routing configuration:
const cvMigrationRoutes = [
  {
    path: 'cv-migration-execute',
    loadChildren: () => import('./features/cv/cv.module').then(m => m.CvModule),
    data: { 
      title: 'Execute CV Migration',
      directAccess: true
    }
  }
];

// Or access directly via:
// http://localhost:4200/dashboard/cv-nuevo/execute-migration
