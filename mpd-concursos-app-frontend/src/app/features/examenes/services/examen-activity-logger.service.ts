private setupNetworkMonitoring(): void {
    if (navigator?.connection) {
        // Implementar monitoreo de red
        navigator.connection.addEventListener('change', this.handleNetworkChange.bind(this));
    } else {
        // Usar fallback para monitoreo de red
        window.addEventListener('online', () => this.handleNetworkChange({ type: 'online' }));
        window.addEventListener('offline', () => this.handleNetworkChange({ type: 'offline' }));
    }
}

private handleNetworkChange(event: any): void {
    const isOnline = navigator.onLine;
    this.logNetworkEvent({
        type: 'NETWORK_STATUS_CHANGE',
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        details: event
    });
} 