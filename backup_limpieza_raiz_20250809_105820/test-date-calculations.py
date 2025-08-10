#!/usr/bin/env python3
"""
Script para probar los cálculos de fechas y vencimientos
Simula la lógica de backend Java en Python para validación
"""

from datetime import datetime, timedelta, date
import calendar

def get_business_days_between(start_date, end_date):
    """Calcula días hábiles entre dos fechas (lunes a viernes)"""
    current = start_date
    business_days = 0
    while current <= end_date:
        if current.weekday() < 5:  # 0-4 = lunes a viernes
            business_days += 1
        current += timedelta(days=1)
    return business_days

def calculate_documentation_deadline(inscription_end_date):
    """Calcula plazo perentorio para documentación: 3 días hábiles DESPUÉS del vencimiento de inscripción"""
    if not inscription_end_date:
        return None
    
    # Empezar desde el día SIGUIENTE al vencimiento de inscripción
    deadline = inscription_end_date + timedelta(days=1)
    deadline = deadline.replace(hour=0, minute=0, second=0, microsecond=0)
    
    business_days_added = 0
    
    while business_days_added < 3:
        # Verificar si es día hábil (lunes a viernes)
        if deadline.weekday() < 5:  # 0-4 = lunes a viernes
            business_days_added += 1
        
        # Si ya agregamos 3 días hábiles, no sumar más días
        if business_days_added < 3:
            deadline += timedelta(days=1)
    
    # El último día hábil está disponible hasta las 23:59:59
    return deadline.replace(hour=23, minute=59, second=59)

def get_days_remaining(deadline_date):
    """Calcula días restantes hasta el vencimiento (lógica corregida)"""
    if not deadline_date:
        return None
    
    now = datetime.now().date()
    deadline_date_only = deadline_date.date()
    
    # Si ya pasó la fecha, es 0 días (vencido)
    if now > deadline_date_only:
        return 0
    
    # Si es hoy, verificar la hora
    if now == deadline_date_only:
        # Si aún no pasó la hora del deadline, cuenta como "hoy" (0 días)
        if datetime.now() <= deadline_date:
            return 0
        else:
            return 0  # Ya vencido hoy
    
    # Para fechas futuras, calcular días inclusive
    # Si hoy es 7/8 y deadline es 8/8, devuelve 1 día
    return (deadline_date_only - now).days

def test_scenarios():
    """Prueba diferentes escenarios de fechas"""
    print("🧪 PRUEBAS DE CÁLCULO DE FECHAS Y VENCIMIENTOS")
    print("=" * 60)
    
    # Caso 1: Concurso actual (vence 8/8/2025 a las 23:59:59)
    print("\n📅 CASO 1: Concurso actual")
    inscription_end = datetime(2025, 8, 8, 23, 59, 59)
    print(f"Vencimiento inscripción: {inscription_end}")
    
    # Simular fechas actuales
    test_dates = [
        datetime(2025, 8, 7, 10, 0, 0),  # Hoy 7/8 a las 10:00
        datetime(2025, 8, 7, 23, 30, 0), # Hoy 7/8 a las 23:30
        datetime(2025, 8, 8, 10, 0, 0),  # Mañana 8/8 a las 10:00
        datetime(2025, 8, 8, 23, 0, 0),  # Mañana 8/8 a las 23:00
        datetime(2025, 8, 8, 23, 59, 59), # Mañana 8/8 a las 23:59:59
        datetime(2025, 8, 9, 1, 0, 0),   # Pasado mañana 9/8 a las 01:00
    ]
    
    for test_date in test_dates:
        # Mock datetime.now() para cada caso
        original_now = datetime.now()
        
        # Simular cálculo de días restantes
        now_date = test_date.date()
        deadline_date_only = inscription_end.date()
        
        if now_date > deadline_date_only:
            days_remaining = 0
        elif now_date == deadline_date_only:
            days_remaining = 0 if test_date <= inscription_end else 0
        else:
            days_remaining = (deadline_date_only - now_date).days
        
        status = "✅ Disponible" if test_date <= inscription_end else "❌ Vencido"
        print(f"  {test_date.strftime('%d/%m/%Y %H:%M')} → {days_remaining} días restantes ({status})")
    
    # Caso 2: Plazo de documentación
    print(f"\n📋 CASO 2: Plazo de documentación")
    doc_deadline = calculate_documentation_deadline(inscription_end)
    print(f"Plazo documentación: {doc_deadline}")
    
    print(f"Días hábiles desde {inscription_end.date()} hasta {doc_deadline.date()}:")
    
    current = inscription_end.date() + timedelta(days=1)
    business_days = 0
    while current <= doc_deadline.date():
        day_name = calendar.day_name[current.weekday()]
        is_business = current.weekday() < 5
        if is_business:
            business_days += 1
        print(f"  {current.strftime('%d/%m/%Y')} ({day_name}): {'✅ Hábil' if is_business else '❌ No hábil'}")
        current += timedelta(days=1)
    
    print(f"Total días hábiles: {business_days}")
    
    # Caso 3: Mensajes para el usuario
    print(f"\n💬 CASO 3: Mensajes para el usuario")
    current_date = datetime(2025, 8, 7, 15, 0, 0)  # Hoy 7/8 a las 15:00
    
    def get_user_message(days_remaining, deadline_date):
        if days_remaining < 0:
            return "⚠️ VENCIDO"
        elif days_remaining == 0:
            if datetime.now() < deadline_date:
                hours_left = int((deadline_date - datetime.now()).total_seconds() / 3600)
                return f"🔥 VENCE HOY (quedan {hours_left}h)"
            else:
                return "⚠️ VENCIDO HOY"
        elif days_remaining == 1:
            return "⚡ VENCE MAÑANA"
        else:
            return f"📅 {days_remaining} DÍAS RESTANTES"
    
    # Simular para hoy (7/8)
    days_remaining = (inscription_end.date() - current_date.date()).days
    message = get_user_message(days_remaining, inscription_end)
    print(f"  Hoy {current_date.strftime('%d/%m %H:%M')}: {message}")

if __name__ == "__main__":
    test_scenarios()
