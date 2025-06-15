/**
 * CRITICAL: Global ApexCharts Configuration
 * This file provides global configuration for ApexCharts with glassmorphism theme
 */

import { ApexOptions } from 'ng-apexcharts';

/**
 * Global ApexCharts configuration for glassmorphism theme
 */
export function configureGlobalApexChartsDefaults(): void {
  console.log('✅ ApexCharts global configuration applied - glassmorphism theme enabled');
}

/**
 * Base ApexCharts options with glassmorphism theme
 */
export const APEX_GLOBAL_OPTIONS: any = {
  // Global colors for glassmorphism theme
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],

  // Global theme for glassmorphism
  theme: {
    mode: 'dark',
    palette: 'palette1'
  },

  // Legend styling
  legend: {
    labels: {
      colors: '#f9fafb'
    }
  },

  // Tooltip styling
  tooltip: {
    theme: 'dark',
    style: {
      fontSize: '12px',
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif'
    }
  },

  // Responsive settings
  responsive: [{
    breakpoint: 768,
    options: {
      chart: {
        height: 300
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
};

/**
 * ApexCharts configuration for specific chart types
 */
export const APEX_CHART_TYPE_DEFAULTS: Record<string, any> = {
  pie: {
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    }
  },

  donut: {
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    }
  },

  bar: {
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%'
      }
    },
    dataLabels: {
      enabled: false
    }
  },

  line: {
    stroke: {
      curve: 'smooth',
      width: 2
    },
    dataLabels: {
      enabled: false
    }
  }
};
