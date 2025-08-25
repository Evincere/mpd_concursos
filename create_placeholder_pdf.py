#!/usr/bin/env python3
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from datetime import datetime

def create_placeholder_pdf(filename, document_type="Documento", user_dni=""):
    doc = SimpleDocTemplate(filename, pagesize=A4,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.textColor = colors.red
    
    normal_style = styles['Normal']
    
    story = []
    
    # Título
    story.append(Paragraph("ARCHIVO PLACEHOLDER - REQUIERE PROCESAMIENTO ADMINISTRATIVO", title_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Información del documento
    story.append(Paragraph(f"<b>Tipo de Documento:</b> {document_type}", normal_style))
    story.append(Spacer(1, 0.2*inch))
    
    if user_dni:
        story.append(Paragraph(f"<b>DNI Usuario:</b> {user_dni}", normal_style))
        story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(f"<b>Fecha de Generación:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Mensaje explicativo
    story.append(Paragraph("<b>ESTADO:</b> Este archivo es un placeholder generado automáticamente.", normal_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("El documento original no se encuentra disponible físicamente en el servidor.", normal_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Este archivo mantiene la integridad referencial del sistema hasta que el documento real sea procesado por el área administrativa.", normal_style))
    story.append(Spacer(1, 0.5*inch))
    
    story.append(Paragraph("<b>ACCIÓN REQUERIDA:</b>", normal_style))
    story.append(Paragraph("• Contactar al usuario para reenvío del documento", normal_style))
    story.append(Paragraph("• Verificar backup de documentos", normal_style))
    story.append(Paragraph("• Actualizar estado en sistema administrativo", normal_style))
    
    doc.build(story)
    return True

if __name__ == "__main__":
    if len(sys.argv) >= 2:
        filename = sys.argv[1]
        document_type = sys.argv[2] if len(sys.argv) > 2 else "Documento"
        user_dni = sys.argv[3] if len(sys.argv) > 3 else ""
        create_placeholder_pdf(filename, document_type, user_dni)
        print(f"Archivo placeholder creado: {filename}")
    else:
        print("Uso: python3 create_placeholder_pdf.py <filename> [document_type] [user_dni]")
