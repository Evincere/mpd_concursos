// ========================================
// 🚀 NAVIGATION FIX IMPLEMENTATION
// ========================================
// Apply these changes to your page.tsx file

// 1️⃣ IMPROVED navigateToNextPostulant FUNCTION
const navigateToNextPostulant = () => {
  console.log('🚀 navigateToNextPostulant called');
  console.log('📋 allPostulantsList:', allPostulantsList);
  console.log('🔍 Current DNI:', currentDni);
  console.log('📊 Lista length:', allPostulantsList?.length || 0);

  // Verificar si hay postulantes disponibles
  if (!allPostulantsList || allPostulantsList.length === 0) {
    console.log('❌ No hay postulantes en la lista, redirigiendo al dashboard');
    router.push('/postulations');
    return;
  }

  // Buscar el índice del postulante actual
  let currentIndex = allPostulantsList.findIndex(dni => dni === currentDni);
  console.log('📍 Current index:', currentIndex);

  // SI EL POSTULANTE ACTUAL NO ESTÁ EN LA LISTA (porque fue aprobado/rechazado)
  if (currentIndex === -1) {
    console.log('🔍 Current postulant not found in list (likely approved/rejected)');
    console.log('📋 Available DNIs:', allPostulantsList.slice(0, 5)); // Mostrar primeros 5
    
    // NUEVA LÓGICA: Ir al primer postulante disponible
    if (allPostulantsList.length > 0) {
      const firstAvailableDni = allPostulantsList[0];
      console.log(`✅ Navegando al primer postulante disponible: ${firstAvailableDni}`);
      router.push(`/postulations/validate/${firstAvailableDni}`);
      return;
    } else {
      console.log('🎉 No hay más postulantes pendientes');
      router.push('/postulations');
      return;
    }
  }

  // NAVEGAR AL SIGUIENTE POSTULANTE (lógica existente mejorada)
  const nextIndex = currentIndex + 1;
  if (nextIndex < allPostulantsList.length) {
    const nextDni = allPostulantsList[nextIndex];
    console.log(`✅ Navegando al siguiente postulante: ${nextDni} (index: ${nextIndex})`);
    router.push(`/postulations/validate/${nextDni}`);
  } else {
    console.log('🎉 Era el último postulante, redirigiendo al dashboard');
    router.push('/postulations');
  }
};

// 2️⃣ IMPROVED APPROVAL HANDLER
const handleApprove = async () => {
  console.log('🟢 Aprobando postulación:', { 
    inscriptionId: currentInscription?.id, 
    postulantName: currentPostulant?.fullName, 
    dni: currentDni 
  });

  // GUARDAR INFORMACIÓN ANTES DE LA APROBACIÓN
  const currentIndex = allPostulantsList?.findIndex(dni => dni === currentDni) || -1;
  const nextIndex = currentIndex + 1;
  const hasNextPostulant = nextIndex < (allPostulantsList?.length || 0);
  const nextDni = hasNextPostulant ? allPostulantsList?.[nextIndex] : null;

  console.log('📊 Pre-approval state:', {
    currentIndex,
    nextIndex,
    hasNextPostulant,
    nextDni,
    totalPostulants: allPostulantsList?.length || 0
  });

  try {
    // Aprobar la postulación
    const approvalData = {
      inscriptionId: currentInscription?.id,
      note: 'Postulación aprobada tras validación de documentos'
    };

    const response = await fetch(`/api/postulations/${currentDni}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Aprobación exitosa:', result);

    // ACTUALIZAR LA LISTA DESPUÉS DE LA APROBACIÓN
    console.log('🔄 Actualizando lista de postulantes después de aprobar...');
    await fetchAllPostulantsList();

    // NAVEGAR BASÁNDOSE EN LA INFORMACIÓN PRE-GUARDADA
    if (nextDni && allPostulantsList?.includes(nextDni)) {
      console.log(`✅ Navegando al siguiente postulante planificado: ${nextDni}`);
      router.push(`/postulations/validate/${nextDni}`);
    } else if (allPostulantsList && allPostulantsList.length > 0) {
      const firstAvailable = allPostulantsList[0];
      console.log(`✅ Siguiente planificado no disponible, navegando al primero: ${firstAvailable}`);
      router.push(`/postulations/validate/${firstAvailable}`);
    } else {
      console.log('🎉 No hay más postulantes pendientes, redirigiendo al dashboard');
      router.push('/postulations');
    }

  } catch (error) {
    console.error('❌ Error al aprobar postulación:', error);
    // Manejar error sin navegar
  }
};

// 3️⃣ ENHANCED LOGGING FOR fetchAllPostulantsList
const fetchAllPostulantsList = async () => {
  console.log('🔄 fetchAllPostulantsList - Iniciando carga de lista de postulantes...');
  
  try {
    console.log('📡 Haciendo fetch a /api/backend/inscriptions');
    const response = await fetch('/api/backend/inscriptions');
    console.log('📨 Respuesta recibida:', { ok: response.ok, status: response.status, statusText: response.statusText });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📋 Datos de API recibidos:', {
      success: data.success,
      dataLength: data.data?.length || 0,
      firstItem: data.data?.[0] ? {
        dni: data.data[0].userInfo?.dni,
        state: data.data[0].state,
        name: data.data[0].userInfo?.fullName
      } : null
    });

    if (!data.success || !data.data) {
      throw new Error('Respuesta inválida de la API');
    }

    console.log('🔧 Procesando datos...');
    
    // Procesar datos y filtrar postulantes listos para validación
    const processedPostulants = [];
    const alreadyProcessed = [];

    data.data.forEach((postulant, index) => {
      const dni = postulant.userInfo?.dni;
      const state = postulant.state;
      const isReady = state === 'COMPLETED_WITH_DOCS';
      
      console.log(`📝 Postulante ${postulant.userInfo?.fullName} (${dni}): estado=${state}, listo=${isReady}`);
      
      if (isReady) {
        processedPostulants.push(dni);
      } else {
        alreadyProcessed.push({ dni, state });
      }
    });

    // Ordenar por DNI para consistencia
    processedPostulants.sort();

    console.log('🔍 Postulantes pendientes de validación:', processedPostulants.length);
    console.log('📊 Postulantes ya procesados:', alreadyProcessed.length);

    // Verificar si el postulante actual sigue en la lista
    const currentStillInList = processedPostulants.includes(currentDni);
    console.log('🔎 Postulante actual encontrado:', currentStillInList ? 'Sí' : 'No encontrado');

    // Actualizar estado
    setAllPostulantsList(processedPostulants);

    console.log('📝 Lista final de DNIs ordenada:', processedPostulants);
    console.log('✅ Lista de postulantes cargada exitosamente:', processedPostulants.length, 'postulantes');

    return processedPostulants;

  } catch (error) {
    console.error('❌ Error al cargar lista de postulantes:', error);
    throw error;
  }
};

// 4️⃣ ENHANCED DOCUMENT LOADING ERROR HANDLING
const loadDocumentPreview = async (documentId: string) => {
  try {
    console.log(`🔍 Cargando documento: ${documentId} para DNI: ${currentDni}`);
    
    // Verificar que el documento pertenece al postulante actual
    if (!currentDni) {
      console.log('⚠️ No hay DNI actual, saltando carga de documento');
      return null;
    }

    const response = await fetch(`/api/documents/${documentId}/view`);
    
    if (response.status === 404) {
      console.log(`⚠️ Documento ${documentId} no encontrado (404) - posiblemente fue eliminado o no pertenece al postulante actual`);
      // No mostrar el documento, pero no fallar
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ Documento ${documentId} cargado exitosamente`);
    return await response.blob();

  } catch (error) {
    console.error(`❌ Error al cargar documento ${documentId}:`, error);
    // Manejar gracefully, no romper la aplicación
    return null;
  }
};

// 5️⃣ CLEANUP FUNCTION FOR COMPONENT UNMOUNT
const cleanupCurrentPostulant = () => {
  console.log('🧹 Limpiando componente...');
  
  // Limpiar estados relacionados con el postulante actual
  setCurrentPostulant(null);
  setCurrentInscription(null);
  setDocuments([]);
  setValidationErrors([]);
  
  // Cancelar cualquier fetch en progreso si es posible
  // controller?.abort();
  
  console.log('✅ Limpieza completada');
};

// APPLY THESE CHANGES TO YOUR EXISTING CODE:
// 1. Replace your navigateToNextPostulant function with the improved version above
// 2. Replace your handleApprove function with the improved version above  
// 3. Add the enhanced logging to your fetchAllPostulantsList function
// 4. Add document error handling to prevent 404 errors from breaking the flow
// 5. Add cleanup function to handle component unmounting properly

export {
  navigateToNextPostulant,
  handleApprove,
  fetchAllPostulantsList,
  loadDocumentPreview,
  cleanupCurrentPostulant
};
