/**
 * Script de debug para verificar el estado de las imágenes de perfil
 * Ejecutar en la consola del navegador
 */

console.log('=== DEBUG PROFILE IMAGE ===');

// Verificar localStorage
console.log('1. LocalStorage keys relacionadas con profile image:');
const profileImageKeys = Object.keys(localStorage).filter(key => 
  key.includes('userProfileImage') || key.includes('profileImage')
);
console.log('Keys found:', profileImageKeys);

profileImageKeys.forEach(key => {
  console.log(`${key}: ${localStorage.getItem(key)}`);
});

// Verificar AuthService si está disponible
if (window.ng && window.ng.getComponent) {
  console.log('2. Intentando acceder al AuthService...');
  try {
    // Buscar un componente que use AuthService
    const elements = document.querySelectorAll('app-user-info, app-navbar, app-main');
    for (let element of elements) {
      try {
        const component = window.ng.getComponent(element);
        if (component && component.authService) {
          console.log('AuthService found in component:', component);
          console.log('UserInfo signal:', component.authService.userInfo());
          break;
        }
      } catch (e) {
        // Continuar buscando
      }
    }
  } catch (error) {
    console.log('No se pudo acceder al AuthService:', error);
  }
}

// Verificar elementos de imagen en el DOM
console.log('3. Elementos de imagen de perfil en el DOM:');
const profileImages = document.querySelectorAll('.profile-image, img[alt*="perfil"], img[src*="profile"]');
console.log('Profile images found:', profileImages.length);

profileImages.forEach((img, index) => {
  console.log(`Image ${index + 1}:`, {
    src: img.src,
    alt: img.alt,
    classList: Array.from(img.classList),
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete
  });
});

// Verificar user-info component
console.log('4. User-info component:');
const userInfoElements = document.querySelectorAll('app-user-info');
userInfoElements.forEach((element, index) => {
  console.log(`User-info ${index + 1}:`, {
    innerHTML: element.innerHTML,
    hasProfileImage: element.querySelector('.profile-image') !== null,
    hasDefaultAvatar: element.querySelector('.default-avatar') !== null
  });
});

console.log('=== END DEBUG ===');
