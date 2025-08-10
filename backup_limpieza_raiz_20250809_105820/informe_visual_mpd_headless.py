import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.dates as mdates

# Configuración de estilo
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 12

# Crear figura con subplots
fig = plt.figure(figsize=(20, 24))
fig.suptitle('📊 INFORME INTEGRAL MPD CONCURSOS - SISTEMA DE GESTIÓN', fontsize=20, fontweight='bold', y=0.98)

# Datos para los gráficos
# 1. Usuarios totales por estado
usuarios_data = {
    'ACTIVOS': 254,
    'BLOQUEADOS': 0,
    'INACTIVOS': 0
}

# 2. Registros diarios
registros_diarios = {
    '2025-07-30': 60,
    '2025-07-31': 36,
    '2025-08-01': 24,
    '2025-08-02': 6,
    '2025-08-03': 4,
    '2025-08-04': 37,
    '2025-08-05': 25,
    '2025-08-06': 39,
    '2025-08-07': 23
}

# 3. Centro de vida
centro_vida_data = {
    'Con centro de vida declarado': 92,
    'Sin centro de vida': 64
}

# 4. Estado de documentación
doc_status_data = {
    'Documentación completa': 77,
    'Inscripción iniciada': 64,
    'Documentación pendiente': 15
}

# 5. Departamentos (centro de vida)
departamentos_data = {
    'Mendoza Capital': 76,
    'Sin especificar': 64,
    'Otros departamentos': 13,
    'Godoy Cruz': 2,
    'Las Heras': 1
}

# 6. Rangos etarios
edad_data = {
    '35-44 años': 112,
    '25-34 años': 91,
    '45-54 años': 43,
    '55-64 años': 3,
    '18-24 años': 3
}

# 7. Género
genero_data = {
    'No determinado': 185,
    'Femenino': 36,
    'Masculino': 33
}

# GRÁFICO 1: Usuarios registrados totales
ax1 = plt.subplot(4, 3, 1)
colors = ['#2E8B57', '#DC143C', '#FF6347']
sizes = list(usuarios_data.values())
labels = [f'{k}\n({v:,})' for k, v in usuarios_data.items()]
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
plt.title('👥 USUARIOS REGISTRADOS POR ESTADO\n(Total: 254)', fontweight='bold')

# GRÁFICO 2: Registros diarios
ax2 = plt.subplot(4, 3, 2)
fechas = list(registros_diarios.keys())
valores = list(registros_diarios.values())
plt.bar(fechas, valores, color='#4472C4', alpha=0.8)
plt.title('📈 REGISTROS DIARIOS DE USUARIOS', fontweight='bold')
plt.xticks(rotation=45)
plt.ylabel('Usuarios registrados')
for i, v in enumerate(valores):
    plt.text(i, v + 1, str(v), ha='center', fontweight='bold')
total_registros = sum(valores)
plt.text(len(fechas)/2, max(valores) * 0.8, f'Total: {total_registros} usuarios', 
         ha='center', fontsize=12, bbox=dict(boxstyle="round", facecolor='wheat', alpha=0.5))

# GRÁFICO 3: Centro de vida declarado
ax3 = plt.subplot(4, 3, 3)
labels = list(centro_vida_data.keys())
sizes = list(centro_vida_data.values())
colors = ['#32CD32', '#FFB6C1']
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
plt.title('🏠 DECLARACIÓN DE CENTRO DE VIDA\n(Total inscritos: 156)', fontweight='bold')

# GRÁFICO 4: Estado de documentación
ax4 = plt.subplot(4, 3, 4)
labels = list(doc_status_data.keys())
sizes = list(doc_status_data.values())
colors = ['#228B22', '#4169E1', '#FF4500']
wedges, texts, autotexts = plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
plt.title('📄 ESTADO DE DOCUMENTACIÓN\n(Proceso de inscripción)', fontweight='bold')

# GRÁFICO 5: Distribución por departamentos
ax5 = plt.subplot(4, 3, 5)
deps = list(departamentos_data.keys())
cantidades = list(departamentos_data.values())
bars = plt.bar(deps, cantidades, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'])
plt.title('🗺️ USUARIOS POR DEPARTAMENTO\n(Según centro de vida)', fontweight='bold')
plt.xticks(rotation=45, ha='right')
plt.ylabel('Cantidad de usuarios')
for bar, cantidad in zip(bars, cantidades):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, 
             str(cantidad), ha='center', va='bottom', fontweight='bold')

# GRÁFICO 6: Distribución etaria
ax6 = plt.subplot(4, 3, 6)
edades = list(edad_data.keys())
cant_edades = list(edad_data.values())
bars = plt.bar(edades, cant_edades, color=['#FF9999', '#66B2FF', '#99FF99', '#FFD700', '#FF69B4'])
plt.title('🎂 DISTRIBUCIÓN POR EDAD\n(Usuarios con fecha de nacimiento: 252)', fontweight='bold')
plt.xticks(rotation=45)
plt.ylabel('Cantidad de usuarios')
for bar, cantidad in zip(bars, cant_edades):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2, 
             str(cantidad), ha='center', va='bottom', fontweight='bold')

# GRÁFICO 7: Distribución por género
ax7 = plt.subplot(4, 3, 7)
generos = list(genero_data.keys())
cant_generos = list(genero_data.values())
colors_gender = ['#DDA0DD', '#FFB6C1', '#87CEEB']
plt.pie(cant_generos, labels=generos, colors=colors_gender, autopct='%1.1f%%', startangle=90)
plt.title('⚥ DISTRIBUCIÓN POR GÉNERO\n(Análisis por nombres)', fontweight='bold')

# GRÁFICO 8: Progreso de inscripciones (embudo)
ax8 = plt.subplot(4, 3, 8)
etapas = ['Usuarios\nRegistrados', 'Usuarios\nInscritos', 'Centro Vida\nDeclarado', 'Documentación\nCompleta']
cantidades_embudo = [254, 156, 92, 77]
porcentajes = [100, 61.4, 36.2, 30.3]

bars = plt.barh(etapas, cantidades_embudo, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'])
plt.title('🎯 EMBUDO DE CONVERSIÓN\n(Proceso completo)', fontweight='bold')
plt.xlabel('Cantidad de usuarios')

for i, (bar, cantidad, pct) in enumerate(zip(bars, cantidades_embudo, porcentajes)):
    plt.text(bar.get_width() + 5, bar.get_y() + bar.get_height()/2, 
             f'{cantidad}\n({pct:.1f}%)', ha='left', va='center', fontweight='bold')

# GRÁFICO 9: Métricas clave
ax9 = plt.subplot(4, 3, 9)
ax9.axis('off')
metricas = [
    ('👥 Total Usuarios Registrados', '254'),
    ('📝 Total Inscripciones', '156'),
    ('✅ Documentación Completa', '77 (49.4%)'),
    ('🏠 Con Centro de Vida', '92 (59.0%)'),
    ('📄 Total Documentos', '1,159'),
    ('🎯 Concursos Activos', '1 (MULTIFUERO)'),
    ('📊 Tasa de Conversión', '61.4%'),
    ('⏱️ Período de Registro', '8 días')
]

y_pos = 0.9
for metrica, valor in metricas:
    ax9.text(0.05, y_pos, metrica, fontsize=12, fontweight='bold', transform=ax9.transAxes)
    ax9.text(0.95, y_pos, valor, fontsize=12, ha='right', color='blue', fontweight='bold', transform=ax9.transAxes)
    y_pos -= 0.11

ax9.set_title('📋 MÉTRICAS CLAVE DEL SISTEMA', fontweight='bold', pad=20)

# GRÁFICO 10: Evolución acumulativa de registros
ax10 = plt.subplot(4, 3, 10)
fechas = list(registros_diarios.keys())
valores = list(registros_diarios.values())
acumulativo = np.cumsum(valores)

plt.plot(fechas, acumulativo, marker='o', linewidth=3, markersize=8, color='#2E8B57')
plt.fill_between(fechas, acumulativo, alpha=0.3, color='#2E8B57')
plt.title('📈 EVOLUCIÓN ACUMULATIVA DE REGISTROS', fontweight='bold')
plt.xticks(rotation=45)
plt.ylabel('Usuarios acumulados')
plt.grid(True, alpha=0.3)

for i, (fecha, acum) in enumerate(zip(fechas, acumulativo)):
    plt.annotate(f'{acum}', (i, acum), textcoords="offset points", xytext=(0,10), ha='center', fontweight='bold')

# GRÁFICO 11: Comparativo de completitud
ax11 = plt.subplot(4, 3, 11)
categorias = ['Inscripciones\nIniciadas', 'Con Centro\nde Vida', 'Doc. Pendiente', 'Doc. Completa']
valores_comp = [156, 92, 15, 77]
porcentajes_comp = [100, 59.0, 9.6, 49.4]

bars = plt.bar(categorias, valores_comp, color=['#FF6B6B', '#4ECDC4', '#FFA07A', '#32CD32'])
plt.title('📊 ANÁLISIS DE COMPLETITUD\n(Base: 156 inscripciones)', fontweight='bold')
plt.ylabel('Cantidad')

for bar, valor, pct in zip(bars, valores_comp, porcentajes_comp):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2, 
             f'{valor}\n({pct:.1f}%)', ha='center', va='bottom', fontweight='bold')

# GRÁFICO 12: Estado general del sistema
ax12 = plt.subplot(4, 3, 12)
ax12.axis('off')

# Crear una visualización de estado tipo dashboard
estado_items = [
    ('🟢 Sistema Operativo', 'ACTIVO'),
    ('🟢 Base de Datos', 'FUNCIONANDO'),
    ('🟢 Registro de Usuarios', 'HABILITADO'),
    ('🟢 Concurso MULTIFUERO', 'EN CURSO'),
    ('🟡 Proceso Documentación', 'EN PROGRESO'),
    ('🟢 Auditoría', 'ACTIVA')
]

y_pos = 0.9
for item, estado in estado_items:
    color = 'green' if estado in ['ACTIVO', 'FUNCIONANDO', 'HABILITADO', 'EN CURSO', 'ACTIVA'] else 'orange'
    ax12.text(0.05, y_pos, item, fontsize=11, fontweight='bold', transform=ax12.transAxes)
    ax12.text(0.95, y_pos, estado, fontsize=11, ha='right', color=color, fontweight='bold', transform=ax12.transAxes)
    y_pos -= 0.13

ax12.set_title('🔋 ESTADO GENERAL DEL SISTEMA', fontweight='bold', pad=20)

# Ajustar layout
plt.tight_layout()

# Añadir información adicional en la parte inferior
fig.text(0.5, 0.02, f'📅 Reporte generado: {datetime.now().strftime("%d/%m/%Y %H:%M")} | 💻 Sistema MPD Concursos | 🏛️ Ministerio Público Defensor - Mendoza', 
         ha='center', fontsize=10, style='italic')

plt.savefig('informe_visual_mpd_concursos.png', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none')

print("✅ Informe visual generado exitosamente: 'informe_visual_mpd_concursos.png'")
print("\n📊 RESUMEN EJECUTIVO:")
print("="*60)
print(f"👥 Total usuarios registrados: 254")
print(f"📝 Total inscripciones al concurso: 156 (61.4% conversión)")
print(f"✅ Usuarios con documentación completa: 77 (49.4% del total de inscriptos)")
print(f"🏠 Usuarios con centro de vida declarado: 92 (59.0% del total de inscriptos)")
print(f"📄 Total documentos gestionados: 1,159")
print(f"🎯 Concursos activos: 1 (MULTIFUERO)")
print(f"📈 Pico de registros: 60 usuarios (30/07/2025)")
print(f"🗺️ Concentración geográfica: 76 usuarios en Mendoza Capital")
print(f"👨‍👩‍👧‍👦 Rango etario predominante: 35-44 años (112 usuarios)")
