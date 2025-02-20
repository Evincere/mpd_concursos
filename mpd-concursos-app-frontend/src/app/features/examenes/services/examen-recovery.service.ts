async validateAndRecoverBackup(backup: string): Promise<boolean> {
  try {
    const backupData = JSON.parse(backup);
    if (!Array.isArray(backupData)) {
      console.warn('Formato de backup inválido');
      return false;
    }
    // Validar estructura del backup
    if (!backupData.every(answer => answer.id && answer.response)) {
      console.warn('Backup inválido o corrupto');
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error al validar backup:', e);
    return false;
  }
} 