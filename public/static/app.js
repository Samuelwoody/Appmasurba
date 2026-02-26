// =============================================
// URBANIZACIONES DE VALDEMORILLO
// Control y Estrategia - Por Más Urba Multiservicios
// =============================================

// Estado global de la aplicación
const App = {
  state: {
    user: null,
    token: null,
    currentView: 'login',
    dashboard: null,
    property: null,
    maintenances: [],
    conversations: [],
    currentConversation: null,
    isLoading: false,
    onboardingStep: 0,
    onboardingCompleted: false
  },
  
  // =============================================
  // SISTEMA DE ONBOARDING - SIMPLE
  // =============================================
  
  startOnboarding() {
    if (localStorage.getItem('masurba_onboarding_completed')) {
      this.state.onboardingCompleted = true;
      return;
    }
    this.state.onboardingStep = 0;
    this.showOnboardingStep();
  },
  
  getOnboardingSteps() {
    return [
      { title: '¡Bienvenido a tu panel! 🏠', text: 'Esta app te ayuda a tener tu chalet de Valdemorillo siempre bajo control.', target: null },
      { title: 'Tu puntuación técnica', text: 'Este número indica el estado general de tu vivienda. Se calcula según los datos que registres.', target: '[data-tour="score"]' },
      { title: 'Control de mantenimientos', text: 'Aquí ves los mantenimientos pendientes: caldera, tejado, piscina...', target: '[data-tour="maintenance"]' },
      { title: 'Datos de tu vivienda', text: 'Configura los datos de tu chalet. Cuanta más información, mejores consejos.', target: '[data-tour="property"]' }
    ];
  },
  
  showOnboardingStep() {
    const steps = this.getOnboardingSteps();
    const step = steps[this.state.onboardingStep];
    
    if (!step) {
      this.showChariPopup();
      return;
    }
    
    document.getElementById('tour-overlay')?.remove();
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    
    const overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    
    // En móvil, siempre centrar. En desktop, posicionar cerca del target si existe
    const isMobile = window.innerWidth < 640;
    let targetEl = null;
    
    if (step.target && !isMobile) {
      targetEl = document.querySelector(step.target);
      if (targetEl) {
        targetEl.classList.add('tour-highlight');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    if (!document.getElementById('tour-styles')) {
      const style = document.createElement('style');
      style.id = 'tour-styles';
      style.textContent = '.tour-highlight{position:relative;z-index:9999;box-shadow:0 0 0 4px #5bb88a,0 0 20px rgba(91,184,138,0.5);border-radius:12px;background:white;}';
      document.head.appendChild(style);
    }
    
    // Crear la caja del tooltip - siempre centrada en móvil
    const box = document.createElement('div');
    box.style.cssText = 'background:white;padding:20px;border-radius:16px;max-width:320px;width:100%;z-index:9999;box-shadow:0 25px 50px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;';
    
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="background:#e8f5e9;color:#2e7d32;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${this.state.onboardingStep + 1} / ${steps.length + 1}</span>
        <button onclick="App.endTour()" style="color:#999;border:none;background:none;cursor:pointer;font-size:13px;">Saltar</button>
      </div>
      <h3 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">${step.title}</h3>
      <p style="margin:0 0 20px;color:#666;font-size:14px;line-height:1.5;">${step.text}</p>
      <div style="display:flex;justify-content:space-between;gap:12px;">
        ${this.state.onboardingStep > 0 ? '<button onclick="App.prevStep()" style="color:#666;border:none;background:none;cursor:pointer;font-size:14px;padding:10px 0;">← Anterior</button>' : '<div></div>'}
        <button onclick="App.nextStep()" style="background:linear-gradient(135deg,#5bb88a,#3d9970);color:white;border:none;padding:12px 24px;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;flex-shrink:0;">Siguiente →</button>
      </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  },
  
  nextStep() {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    this.state.onboardingStep++;
    this.showOnboardingStep();
  },
  
  prevStep() {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    if (this.state.onboardingStep > 0) {
      this.state.onboardingStep--;
      this.showOnboardingStep();
    }
  },
  
  showChariPopup() {
    document.getElementById('tour-overlay')?.remove();
    document.getElementById('tour-styles')?.remove();
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    
    const popup = document.createElement('div');
    popup.id = 'chari-popup';
    popup.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto;';
    popup.innerHTML = `
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(20,83,45,0.95),rgba(6,78,59,0.95),rgba(15,118,110,0.95));"></div>
      <div style="position:relative;background:white;border-radius:20px;max-width:400px;width:100%;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.4);margin:auto;">
        <div style="background:linear-gradient(135deg,#22c55e,#10b981,#14b8a6);padding:24px;text-align:center;">
          <div style="width:80px;height:80px;background:white;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,0.15);"><span style="font-size:40px;">👩‍💼</span></div>
          <h2 style="color:white;margin:0 0 4px;font-size:22px;">¡Hola! Soy Chari</h2>
          <p style="color:rgba(255,255,255,0.85);margin:0;font-size:13px;">Tu asesora personal de confianza</p>
        </div>
        <div style="padding:20px;">
          <p style="text-align:center;color:#374151;font-size:15px;line-height:1.5;margin:0 0 16px;">Estoy aquí para ayudarte con <strong>todo lo relacionado con tu vivienda</strong>. Llevo <span style="color:#22c55e;font-weight:600;">8 años</span> asesorando a propietarios de Valdemorillo.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
            <div style="background:#f0fdf4;padding:10px;border-radius:10px;text-align:center;"><div style="font-size:18px;margin-bottom:2px;">📊</div><div style="font-size:11px;color:#666;">Presupuestos</div></div>
            <div style="background:#eff6ff;padding:10px;border-radius:10px;text-align:center;"><div style="font-size:18px;margin-bottom:2px;">🔧</div><div style="font-size:11px;color:#666;">Reformas</div></div>
            <div style="background:#fefce8;padding:10px;border-radius:10px;text-align:center;"><div style="font-size:18px;margin-bottom:2px;">📋</div><div style="font-size:11px;color:#666;">Licencias</div></div>
            <div style="background:#faf5ff;padding:10px;border-radius:10px;text-align:center;"><div style="font-size:18px;margin-bottom:2px;">💡</div><div style="font-size:11px;color:#666;">Consejos</div></div>
          </div>
          <button onclick="App.startChatWithChari()" style="width:100%;background:linear-gradient(135deg,#22c55e,#10b981);color:white;border:none;padding:14px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px rgba(34,197,94,0.4);"><span style="font-size:22px;">💬</span> Iniciar Chat con Chari</button>
        </div>
        <div style="background:#f9fafb;padding:10px;text-align:center;border-top:1px solid #e5e7eb;"><button onclick="App.endTour()" style="color:#9ca3af;border:none;background:none;cursor:pointer;font-size:12px;">Saltar e ir al panel</button></div>
      </div>
    `;
    document.body.appendChild(popup);
  },
  
  startChatWithChari() {
    localStorage.setItem('masurba_onboarding_completed', 'true');
    this.state.onboardingCompleted = true;
    document.getElementById('chari-popup')?.remove();
    this.navigate('chari');
  },
  
  endTour() {
    localStorage.setItem('masurba_onboarding_completed', 'true');
    this.state.onboardingCompleted = true;
    document.getElementById('tour-overlay')?.remove();
    document.getElementById('tour-styles')?.remove();
    document.getElementById('chari-popup')?.remove();
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    this.navigate('dashboard');
  },

  // Inicialización
  async init() {
    // Verificar token guardado
    const token = localStorage.getItem('masurba_token');
    if (token) {
      this.state.token = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        const response = await axios.get('/api/auth/verify');
        if (response.data.success && response.data.valid) {
          this.state.user = response.data.user;
          await this.loadDashboard();
          
          // Cargar notificaciones si es admin
          if (this.state.user.role === 'admin') {
            await this.loadPendingNotifications();
          }
          
          this.navigate(this.state.user.role === 'admin' ? 'admin' : 'dashboard');
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    } else {
      this.navigate('login');
    }
    
    // Ocultar pantalla de carga
    setTimeout(() => {
      document.getElementById('loading-screen')?.remove();
      // Mostrar banner de cookies si no se ha aceptado
      this.showCookieBanner();
    }, 500);
  },
  
  // Navegación
  navigate(view, params = {}) {
    this.state.currentView = view;
    this.render();
    window.scrollTo(0, 0);
  },
  
  // Renderizado principal
  render() {
    const app = document.getElementById('app');
    
    // Mantener loading screen si existe
    const loadingScreen = document.getElementById('loading-screen');
    
    let content = '';
    
    switch (this.state.currentView) {
      case 'login':
        content = this.renderLogin();
        break;
      case 'dashboard':
        content = this.renderLayout(this.renderDashboard());
        break;
      case 'property':
        content = this.renderLayout(this.renderProperty());
        break;
      case 'maintenance':
        content = this.renderLayout(this.renderMaintenance());
        break;
      case 'estimates':
        content = this.renderLayout(this.renderEstimates());
        break;
      case 'strategic':
        content = this.renderLayout(this.renderStrategic());
        break;
      case 'chari':
        content = this.renderLayout(this.renderChari());
        break;
      case 'porche':
        content = this.renderLayout(this.renderPorche());
        break;
      case 'inmourba':
        content = this.renderLayout(this.renderInmoUrba());
        break;
      case 'mercadillo':
        content = this.renderLayout(this.renderMercadillo());
        break;
      case 'admin':
        content = this.renderLayout(this.renderAdmin());
        break;
      case 'admin-neighbors':
        content = this.renderLayout(this.renderAdminNeighbors());
        break;
      case 'admin-services':
        content = this.renderLayout(this.renderAdminServices());
        break;
      case 'admin-reminders':
        content = this.renderLayout(this.renderAdminReminders());
        break;
      case 'admin-managements':
        content = this.renderLayout(this.renderAdminManagements());
        break;
      case 'admin-client':
      case 'neighbor-detail':
        content = this.renderLayout(this.renderNeighborDetail());
        break;
      default:
        content = this.renderLayout(this.renderDashboard());
    }
    
    app.innerHTML = content + (loadingScreen ? loadingScreen.outerHTML : '');
    this.attachEventListeners();
    
    // Actualizar badge de notificaciones si es admin
    if (this.state.user?.role === 'admin') {
      this.updateNotificationBadge();
    }
  },
  
  // Estado para WhatsApp
  whatsappVisible: false,
  
  // Estado para notificaciones pendientes
  pendingNotifications: 0,

  // Mostrar/ocultar WhatsApp
  toggleWhatsApp() {
    this.whatsappVisible = !this.whatsappVisible;
    this.render();
  },
  
  // Cargar contador de notificaciones pendientes
  async loadPendingNotifications() {
    if (this.state.user?.role !== 'admin') return;
    
    try {
      const response = await axios.get('/api/contacts/pending-count');
      if (response.data.success) {
        this.pendingNotifications = response.data.count;
        this.updateNotificationBadge();
        this.updatePWABadge(response.data.count);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  },
  
  // Actualizar badge visual en el header
  updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (this.pendingNotifications > 0) {
        badge.textContent = this.pendingNotifications > 9 ? '9+' : this.pendingNotifications;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  },
  
  // Actualizar badge del icono de la PWA (si el navegador lo soporta)
  updatePWABadge(count) {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(err => console.log('Badge not supported'));
      } else {
        navigator.clearAppBadge().catch(err => console.log('Badge not supported'));
      }
    }
  },

  // Abrir WhatsApp directamente
  openWhatsApp(message = '') {
    const phone = '34742094169';
    const text = message || 'Hola, me gustaría contactar con Más Urba Multiservicios';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  },

  // Layout principal con navegación
  renderLayout(content) {
    const isAdmin = this.state.user?.role === 'admin';
    
    return `
      <div class="min-h-screen bg-white">
        <!-- Header -->
        <header class="header-gradient shadow-sm">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 header-mobile">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 sm:space-x-3">
                <div class="relative">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span class="text-white font-bold text-lg sm:text-xl">UV</span>
                  </div>
                  ${isAdmin ? `
                  <span id="notification-badge" 
                        class="${this.pendingNotifications > 0 ? '' : 'hidden'} absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    ${this.pendingNotifications > 9 ? '9+' : this.pendingNotifications}
                  </span>
                  ` : ''}
                </div>
                <div>
                  <h1 class="text-sm sm:text-lg font-semibold leading-tight text-gray-800">Urbanizaciones Valdemorillo</h1>
                  <p class="text-gray-500 text-xs hidden sm:block">Tu comunidad de vecinos</p>
                </div>
              </div>
              <div class="flex items-center space-x-2 sm:space-x-3">
                <!-- Botón Administración (sutil) -->
                <button onclick="App.toggleWhatsApp()" 
                        class="text-gray-400 hover:text-gray-600 transition text-sm flex items-center"
                        title="Contactar con administración">
                  <i class="fas fa-headset"></i>
                  <span class="hidden sm:inline text-xs ml-1">Administración</span>
                </button>
                <span class="text-sm text-gray-600 hidden md:block">
                  <i class="fas fa-user mr-1 text-gray-400"></i> ${this.state.user?.name || ''}
                </span>
                <button onclick="App.logout()" class="text-gray-400 hover:text-gray-600 transition p-1" title="Cerrar sesión">
                  <i class="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Navegación -->
        <nav class="bg-gray-50 border-b border-gray-200 sticky top-0 z-40" data-tour="nav">
          <div class="max-w-7xl mx-auto px-2 sm:px-4">
            <div class="flex overflow-x-auto overflow-y-visible py-2 nav-mobile-scroll gap-1">
              ${isAdmin ? this.renderAdminNav() : this.renderClientNav()}
            </div>
          </div>
        </nav>
        
        <!-- Contenido principal -->
        <main class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 fade-in pb-20 sm:pb-6">
          ${content}
        </main>
        
        <!-- Footer -->
        <footer class="bg-gray-50 border-t border-gray-200 text-gray-500 py-4 sm:py-6 mt-8 sm:mt-12">
          <div class="max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm">
            <p class="text-gray-600 font-medium">Urbanizaciones de Valdemorillo</p>
            <p class="text-gray-400 mt-1">Tu comunidad de vecinos</p>
            <p class="text-gray-400 mt-2 text-xs">Sponsored by <span class="font-medium">Más Urba Multiservicios</span></p>
          </div>
        </footer>
        
        <!-- WhatsApp Popup -->
        ${this.whatsappVisible ? `
        <div class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 whatsapp-popup">
          <div class="bg-white rounded-2xl shadow-xl p-3 sm:p-4 mb-3 border border-gray-100 max-w-[280px] sm:max-w-xs">
            <div class="flex items-start space-x-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-green-400 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-gray-800 text-sm">Samuel Castellano</p>
                <p class="text-gray-500 text-xs mt-0.5">Más Urba Multiservicios</p>
                <p class="text-gray-600 text-xs sm:text-sm mt-2">¿En qué puedo ayudarte?</p>
              </div>
            </div>
            <button onclick="App.openWhatsApp()" 
                    class="whatsapp-btn w-full mt-3 text-white py-2 sm:py-2.5 rounded-xl font-medium flex items-center justify-center text-sm">
              <i class="fab fa-whatsapp mr-2 text-lg"></i>
              Iniciar chat en WhatsApp
            </button>
          </div>
          <button onclick="App.toggleWhatsApp()" 
                  class="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs transition">
            <i class="fas fa-times"></i>
          </button>
        </div>
        ` : ''}
      </div>
    `;
  },
  
  renderClientNav() {
    const mainItems = [
      { id: 'dashboard', icon: 'tachometer-alt', label: 'Panel' },
      { id: 'property', icon: 'home', label: 'Vivienda' },
      { id: 'maintenance', icon: 'tools', label: 'Manten.' },
      { id: 'estimates', icon: 'calculator', label: 'Estim.' },
      { id: 'strategic', icon: 'chess', label: 'Estrategia' }
    ];

    const comunidadItems = [
      { id: 'porche', label: '🏡 El Porche', desc: 'Muro vecinal' },
      { id: 'inmourba', label: '🏠 InmoUrba', desc: 'Inmobiliaria' },
      { id: 'mercadillo', label: '🏷️ Mercadillo', desc: 'Compraventa' }
    ];

    const isComunidadActive = ['porche', 'inmourba', 'mercadillo'].includes(this.state.currentView);
    
    return `
      ${mainItems.map(item => `
        <button onclick="App.navigate('${item.id}')" 
                class="flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0
                       ${this.state.currentView === item.id 
                         ? 'gradient-bg text-white' 
                         : 'text-gray-600 hover:bg-gray-100'}">
          <i class="fas fa-${item.icon} sm:mr-2"></i>
          <span class="ml-1 sm:ml-0">${item.label}</span>
        </button>
      `).join('')}
      
      <!-- Menú Comunidad -->
      <div class="relative flex-shrink-0" id="comunidad-menu">
        <button onclick="App.toggleComunidadMenu()" 
                class="flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap
                       ${isComunidadActive ? 'gradient-bg text-white' : 'text-gray-600 hover:bg-gray-100'}">
          <i class="fas fa-users sm:mr-2"></i>
          <span class="ml-1 sm:ml-0">Comunidad</span>
          <i class="fas fa-chevron-down ml-1 text-xs"></i>
        </button>
        <div id="comunidad-dropdown" class="hidden fixed mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[60] min-w-48" style="top: auto; left: auto;">
          ${comunidadItems.map(item => `
            <button onclick="App.navigate('${item.id}'); App.closeComunidadMenu();" 
                    class="w-full text-left px-4 py-2 hover:bg-gray-50 transition ${this.state.currentView === item.id ? 'bg-amber-50 text-amber-700' : 'text-gray-700'}">
              <span class="font-medium">${item.label}</span>
              <span class="block text-xs text-gray-400">${item.desc}</span>
            </button>
          `).join('')}
        </div>
      </div>
      
      <button onclick="App.navigate('chari')" 
              class="flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0
                     ${this.state.currentView === 'chari' 
                       ? 'gradient-bg text-white' 
                       : 'text-gray-600 hover:bg-gray-100'}">
        <i class="fas fa-comments sm:mr-2"></i>
        <span class="ml-1 sm:ml-0">Chari</span>
      </button>
    `;
  },

  comunidadMenuOpen: false,
  
  toggleComunidadMenu() {
    this.comunidadMenuOpen = !this.comunidadMenuOpen;
    const dropdown = document.getElementById('comunidad-dropdown');
    const button = document.querySelector('#comunidad-menu button');
    if (dropdown && button) {
      dropdown.classList.toggle('hidden', !this.comunidadMenuOpen);
      if (this.comunidadMenuOpen) {
        // Posicionar el dropdown debajo del botón
        const rect = button.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 4}px`;
        dropdown.style.left = `${rect.left}px`;
      }
    }
  },

  closeComunidadMenu() {
    this.comunidadMenuOpen = false;
    const dropdown = document.getElementById('comunidad-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
  },

  // ==========================================
  // MODALES DE BIENVENIDA (primera visita)
  // ==========================================
  
  showWelcomeModal(section) {
    const storageKey = `welcome_shown_${section}`;
    if (localStorage.getItem(storageKey)) return;
    
    const modals = {
      porche: {
        icon: '🏡',
        title: '¡Bienvenido a El Porche!',
        subtitle: 'Tu espacio de comunicación vecinal',
        features: [
          { icon: '💬', text: 'Comparte noticias, preguntas o comentarios con tus vecinos' },
          { icon: '⭐', text: 'Recomienda proveedores y servicios que te hayan gustado' },
          { icon: '⚠️', text: 'Avisa de incidencias o alertas importantes' },
          { icon: '🎉', text: 'Organiza eventos y quedadas en tu urbanización' },
          { icon: '📸', text: 'Sube hasta 4 fotos en cada publicación' },
          { icon: '❤️', text: 'Reacciona con Like o Corazón a los posts' }
        ],
        tip: 'Chari, nuestra asistente IA, también participa compartiendo consejos útiles sobre mantenimiento y reformas.'
      },
      inmourba: {
        icon: '🏠',
        title: '¡Bienvenido a InmoUrba!',
        subtitle: 'Inmobiliaria exclusiva para vecinos',
        features: [
          { icon: '🆓', text: 'Publica tu vivienda GRATIS desde la pestaña "Vivienda"' },
          { icon: '📊', text: 'Tus datos, fotos y puntuación técnica se transfieren automáticamente' },
          { icon: '🤖', text: 'Chari analiza cada vivienda y comenta su estado técnico' },
          { icon: '💬', text: 'Los interesados pueden dejarte comentarios' },
          { icon: '🔒', text: 'Solo vecinos de las urbanizaciones pueden ver y publicar' },
          { icon: '📍', text: 'Venta o alquiler, tú decides' }
        ],
        tip: 'La puntuación técnica de tu vivienda ayuda a los compradores a tomar mejores decisiones.'
      },
      mercadillo: {
        icon: '🏷️',
        title: '¡Bienvenido al Mercadillo!',
        subtitle: 'Compraventa entre vecinos',
        features: [
          { icon: '🛋️', text: 'Vende muebles, electrónica, cosas de jardín y más' },
          { icon: '📸', text: 'Sube hasta 6 fotos de tu artículo' },
          { icon: '💰', text: 'Pon precio fijo o negociable' },
          { icon: '📍', text: 'Tu urbanización aparece automáticamente' },
          { icon: '💬', text: 'Negocia con comentarios antes de quedar' },
          { icon: '✅', text: 'Marca como reservado o vendido cuando cierres el trato' }
        ],
        tip: 'Al ser entre vecinos, las entregas son fáciles y seguras. ¡Sin intermediarios!'
      }
    };
    
    const m = modals[section];
    if (!m) return;
    
    const modal = document.createElement('div');
    modal.id = 'welcome-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="gradient-bg text-white p-6 rounded-t-2xl text-center">
          <div class="text-5xl mb-3">${m.icon}</div>
          <h2 class="text-2xl font-bold">${m.title}</h2>
          <p class="text-white/80 mt-1">${m.subtitle}</p>
        </div>
        
        <!-- Features -->
        <div class="p-6 space-y-3">
          ${m.features.map(f => `
            <div class="flex items-start space-x-3">
              <span class="text-xl flex-shrink-0">${f.icon}</span>
              <span class="text-gray-700 text-sm">${f.text}</span>
            </div>
          `).join('')}
          
          <!-- Tip -->
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <div class="flex items-start space-x-2">
              <span class="text-amber-500">💡</span>
              <p class="text-amber-800 text-sm">${m.tip}</p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="p-4 border-t border-gray-100">
          <button onclick="App.closeWelcomeModal('${section}')" 
                  class="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
            ¡Entendido, vamos allá!
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  closeWelcomeModal(section) {
    const storageKey = `welcome_shown_${section}`;
    localStorage.setItem(storageKey, 'true');
    document.getElementById('welcome-modal')?.remove();
  },
  
  renderAdminNav() {
    const items = [
      { id: 'admin', icon: 'chart-line', label: 'Dashboard' },
      { id: 'admin-neighbors', icon: 'users', label: 'Vecinos' },
      { id: 'admin-services', icon: 'tools', label: 'Servicios' },
      { id: 'admin-reminders', icon: 'bell', label: 'Recordatorios' },
      { id: 'admin-managements', icon: 'building', label: 'Gestiones' }
    ];
    
    return items.map(item => `
      <button onclick="App.navigate('${item.id}')" 
              class="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
                     ${this.state.currentView === item.id 
                       ? 'gradient-bg text-white' 
                       : 'text-gray-600 hover:bg-gray-100'}">
        <i class="fas fa-${item.icon} mr-2"></i>
        ${item.label}
      </button>
    `).join('');
  },
  
  // =============================================
  // LOGIN
  // =============================================
  renderLogin() {
    return `
      <div class="min-h-screen bg-white">
        <!-- Hero Section -->
        <div class="gradient-bg py-12 px-4">
          <div class="max-w-2xl mx-auto text-center text-white">
            <div class="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur rounded-2xl shadow-lg flex items-center justify-center">
              <span class="text-4xl font-bold text-white">UV</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold leading-tight">
              Urbanizaciones de Valdemorillo
            </h1>
            <p class="mt-4 text-lg text-white/90">
              La app <span class="font-semibold">100% GRATUITA</span> de los vecinos, para los vecinos
            </p>
          </div>
        </div>
        
        <!-- Value Proposition -->
        <div class="max-w-4xl mx-auto px-4 -mt-6">
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            
            <!-- Beneficios principales -->
            <div class="grid md:grid-cols-2 gap-4 mb-8">
              <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-xl">
                <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-comments text-white"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">Chari, tu asesora 24/7</h3>
                  <p class="text-sm text-gray-600">Pregunta lo que quieras sobre tu casa: reformas, mantenimiento, valoraciones, trámites...</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl">
                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-euro-sign text-white"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">Presupuestos orientativos al instante</h3>
                  <p class="text-sm text-gray-600">Sabe cuánto cuesta antes de llamar a nadie. Sin sorpresas ni compromisos.</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 p-3 bg-purple-50 rounded-xl">
                <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-clipboard-check text-white"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">Control de mantenimientos</h3>
                  <p class="text-sm text-gray-600">Nunca más olvides revisar la caldera, el tejado o la piscina. Te avisamos.</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 p-3 bg-amber-50 rounded-xl">
                <div class="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-chart-line text-white"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">Estrategia de valor</h3>
                  <p class="text-sm text-gray-600">¿Reformar o vender? ¿Qué mejoras aportan más valor? Decide con datos.</p>
                </div>
              </div>
            </div>
            
            <!-- Frase gancho -->
            <div class="text-center mb-8 py-4 border-y border-gray-100">
              <p class="text-xl md:text-2xl font-medium text-gray-800">
                "Como tener un arquitecto, un aparejador y un asesor inmobiliario<br class="hidden md:block"> 
                <span class="gradient-text font-bold">en tu bolsillo, gratis</span>"
              </p>
            </div>
            
            <!-- Tabs Login/Registro -->
            <div class="max-w-sm mx-auto">
              <div class="flex mb-6 bg-gray-100 rounded-xl p-1">
                <button id="tab-login" onclick="App.switchAuthTab('login')" 
                        class="flex-1 py-2 px-4 rounded-lg font-semibold transition bg-white text-gray-800 shadow-sm">
                  Entrar
                </button>
                <button id="tab-register" onclick="App.switchAuthTab('register')" 
                        class="flex-1 py-2 px-4 rounded-lg font-semibold transition text-gray-500">
                  Crear cuenta
                </button>
              </div>
              
              <!-- Formulario de Login -->
              <form id="login-form" class="space-y-4">
                <div>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-envelope"></i>
                    </span>
                    <input type="email" id="login-email" required
                           class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                           placeholder="tu@email.com">
                  </div>
                </div>
                
                <div>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input type="password" id="login-password" required
                           class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                           placeholder="••••••••">
                  </div>
                </div>
                
                <div id="login-error" class="hidden text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <i class="fas fa-exclamation-circle mr-2"></i>
                  <span></span>
                </div>
                
                <button type="submit" 
                        class="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center text-lg">
                  <span id="login-btn-text">Entrar</span>
                  <div id="login-btn-loading" class="hidden spinner ml-2"></div>
                </button>
              </form>
              
              <!-- Formulario de Registro -->
              <form id="register-form" class="space-y-4 hidden">
                <div>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-user"></i>
                    </span>
                    <input type="text" id="register-name" required
                           class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                           placeholder="Tu nombre">
                  </div>
                </div>
                
                <div>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-envelope"></i>
                    </span>
                    <input type="email" id="register-email" required
                           class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                           placeholder="tu@email.com">
                  </div>
                </div>
                
                <div>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-phone"></i>
                    </span>
                    <input type="tel" id="register-phone"
                           class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                           placeholder="Teléfono (opcional)">
                  </div>
                </div>
                
                <div>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input type="password" id="register-password" required minlength="6"
                           class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                           placeholder="Contraseña (mín. 6 caracteres)">
                  </div>
                </div>
                
                <div id="register-error" class="hidden text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <i class="fas fa-exclamation-circle mr-2"></i>
                  <span></span>
                </div>
                
                <div id="register-success" class="hidden text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                  <i class="fas fa-check-circle mr-2"></i>
                  <span></span>
                </div>
                
                <button type="submit" 
                        class="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center text-lg">
                  <span id="register-btn-text">Crear mi cuenta gratis</span>
                  <div id="register-btn-loading" class="hidden spinner ml-2"></div>
                </button>
                
                <p class="text-xs text-gray-500 text-center">
                  Al registrarte aceptas nuestra <a href="#" onclick="App.showLegalModal('privacy'); return false;" class="text-green-600 hover:underline">Política de Privacidad</a> 
                  y <a href="#" onclick="App.showLegalModal('terms'); return false;" class="text-green-600 hover:underline">Términos de Uso</a>.
                </p>
              </form>
            </div>
            
            <!-- Mensaje de confianza y privacidad -->
            <div class="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i class="fas fa-user-shield text-white text-sm"></i>
                </div>
                <div>
                  <p class="text-sm font-medium text-green-800">Tu privacidad es lo primero</p>
                  <p class="text-xs text-green-700 mt-1">
                    <strong>Solo tú</strong> tienes acceso a tus datos personales. Nosotros únicamente vemos información 
                    técnica de las viviendas (año, m², estado) para poder asesorarte mejor. 
                    <strong>Nunca compartimos ni vendemos tus datos.</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Trust badges -->
          <div class="mt-6 text-center">
            <div class="flex items-center justify-center space-x-6 text-gray-400 text-sm">
              <span><i class="fas fa-shield-alt mr-1"></i> 100% Seguro</span>
              <span><i class="fas fa-lock mr-1"></i> RGPD Compliant</span>
              <span><i class="fas fa-heart mr-1"></i> Hecho en Valdemorillo</span>
            </div>
            <p class="text-gray-400 text-xs mt-3">
              Sponsored by <span class="font-medium">Más Urba Multiservicios</span> · Solo para vecinos de las urbanizaciones de Valdemorillo
            </p>
            <div class="mt-2 text-xs text-gray-400 space-x-3">
              <a href="#" onclick="App.showLegalModal('privacy'); return false;" class="hover:text-gray-600">Privacidad</a>
              <span>·</span>
              <a href="#" onclick="App.showLegalModal('terms'); return false;" class="hover:text-gray-600">Términos</a>
              <span>·</span>
              <a href="#" onclick="App.showLegalModal('cookies'); return false;" class="hover:text-gray-600">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // =============================================
  // DASHBOARD
  // =============================================
  
  // =============================================
  // DASHBOARD
  // =============================================
  renderDashboard() {
    const d = this.state.dashboard;
    if (!d) return this.renderLoading();
    
    const scoreColor = this.getScoreColor(d.technicalScore);
    
    return `
      <div class="space-y-6">
        <!-- Bienvenida -->
        <div class="gradient-bg rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">Hola, ${d.user?.name?.split(' ')[0] || 'Usuario'}</h2>
              <p class="text-white/80 mt-1">Bienvenido a tu panel de control</p>
            </div>
            <div class="hidden sm:block">
              <button onclick="App.requestContact('diagnosis_360')" 
                      class="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg font-medium transition backdrop-blur">
                <i class="fas fa-phone-alt mr-2"></i>
                Solicitar revisión
              </button>
            </div>
          </div>
        </div>
        
        <!-- Tarjetas principales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Score técnico -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100" data-tour="score">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Estado técnico</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">${d.technicalScore}</p>
                <p class="text-sm ${scoreColor.text} mt-1">
                  <i class="fas fa-${scoreColor.icon} mr-1"></i>
                  ${d.scoreLabel?.label || 'Sin evaluar'}
                </p>
              </div>
              <div class="relative w-20 h-20">
                <svg class="w-full h-full score-ring">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                  <circle cx="40" cy="40" r="35" fill="none" stroke="${scoreColor.stroke}" stroke-width="8"
                          stroke-dasharray="${d.technicalScore * 2.2} 220" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <i class="fas fa-home text-2xl ${scoreColor.text}"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mantenimientos pendientes -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100" data-tour="maintenance">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Mantenimientos</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">${d.pendingMaintenances || 0}</p>
                <p class="text-sm text-gray-500 mt-1">pendientes de revisar</p>
              </div>
              <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-tools text-2xl text-amber-600"></i>
              </div>
            </div>
            <button onclick="App.navigate('maintenance')" 
                    class="mt-4 text-sm text-green-600 hover:text-green-800 font-medium">
              Ver checklist <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
          
          <!-- Chari -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100" data-tour="chari">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-urba-500 text-sm font-medium">Asistente</p>
                <p class="text-xl font-bold text-urba-900 mt-1">Chari</p>
                <p class="text-sm text-urba-500 mt-1">Tu asistente estratégica</p>
              </div>
              <div class="w-14 h-14 bg-urba-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-comments text-2xl text-urba-600"></i>
              </div>
            </div>
            <button onclick="App.navigate('chari')" 
                    class="mt-4 text-sm text-urba-600 hover:text-urba-800 font-medium">
              Hablar con Chari <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
        
        <!-- Vivienda y próximo mantenimiento -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Mi vivienda -->
          <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden" data-tour="property">
            <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
              <h3 class="font-semibold text-urba-900">
                <i class="fas fa-home mr-2 text-urba-500"></i>
                ${d.property?.name || 'Mi Vivienda'}
              </h3>
            </div>
            <div class="p-6">
              ${d.property ? `
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-urba-500">Urbanización</span>
                    <p class="font-medium text-urba-800">${d.property.urbanization || 'No especificada'}</p>
                  </div>
                  <div>
                    <span class="text-urba-500">Año construcción</span>
                    <p class="font-medium text-urba-800">${d.property.year_built || 'No especificado'}</p>
                  </div>
                  <div>
                    <span class="text-urba-500">Superficie</span>
                    <p class="font-medium text-urba-800">${d.property.square_meters ? d.property.square_meters + ' m²' : 'No especificada'}</p>
                  </div>
                  <div>
                    <span class="text-urba-500">Última reforma</span>
                    <p class="font-medium text-urba-800">${d.property.last_integral_reform || 'Sin datos'}</p>
                  </div>
                </div>
                <button onclick="App.navigate('property')" 
                        class="mt-4 text-sm text-urba-600 hover:text-urba-800 font-medium">
                  Editar datos <i class="fas fa-pencil-alt ml-1"></i>
                </button>
              ` : `
                <div class="text-center py-6">
                  <i class="fas fa-home text-4xl text-urba-200 mb-3"></i>
                  <p class="text-urba-500 mb-4">No has configurado tu vivienda</p>
                  <button onclick="App.navigate('property')" 
                          class="bg-urba-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-urba-800 transition">
                    Configurar vivienda
                  </button>
                </div>
              `}
            </div>
          </div>
          
          <!-- Próximo mantenimiento -->
          <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
            <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
              <h3 class="font-semibold text-urba-900">
                <i class="fas fa-calendar-alt mr-2 text-urba-500"></i>
                Próximo mantenimiento
              </h3>
            </div>
            <div class="p-6">
              ${d.nextMaintenance ? `
                <div class="flex items-center space-x-4">
                  <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-${this.getMaintenanceIcon(d.nextMaintenance.category)} text-xl text-amber-600"></i>
                  </div>
                  <div>
                    <p class="font-medium text-urba-900">${this.getMaintenanceLabel(d.nextMaintenance.category)}</p>
                    <p class="text-sm text-urba-500">
                      Recomendado: ${this.formatDate(d.nextMaintenance.next_recommended)}
                    </p>
                  </div>
                </div>
                <button onclick="App.navigate('maintenance')" 
                        class="mt-4 text-sm text-urba-600 hover:text-urba-800 font-medium">
                  Ver todos <i class="fas fa-arrow-right ml-1"></i>
                </button>
              ` : `
                <div class="text-center py-6">
                  <i class="fas fa-check-circle text-4xl text-green-300 mb-3"></i>
                  <p class="text-urba-500">No hay mantenimientos próximos</p>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <!-- Acciones rápidas móvil -->
        <div class="sm:hidden">
          <button onclick="App.requestContact('diagnosis_360')" 
                  class="w-full bg-accent hover:bg-accent-dark text-white px-5 py-3 rounded-lg font-medium transition">
            <i class="fas fa-phone-alt mr-2"></i>
            Solicitar revisión con Samuel
          </button>
        </div>
      </div>
    `;
  },
  
  // =============================================
  // UTILIDADES
  // =============================================
  getScoreColor(score) {
    if (score >= 80) return { text: 'text-green-600', stroke: '#22c55e', icon: 'check-circle' };
    if (score >= 60) return { text: 'text-blue-600', stroke: '#3b82f6', icon: 'thumbs-up' };
    if (score >= 40) return { text: 'text-amber-600', stroke: '#f59e0b', icon: 'exclamation-circle' };
    return { text: 'text-red-600', stroke: '#ef4444', icon: 'exclamation-triangle' };
  },
  
  getMaintenanceIcon(category) {
    const icons = {
      roof: 'home', electricity: 'bolt', plumbing: 'faucet', boiler: 'fire',
      facade: 'building', insulation: 'thermometer-half', pool: 'swimming-pool',
      garden: 'leaf', other: 'wrench'
    };
    return icons[category] || 'wrench';
  },
  
  getMaintenanceLabel(category) {
    const labels = {
      roof: 'Cubierta/Tejado', electricity: 'Electricidad', plumbing: 'Fontanería',
      boiler: 'Caldera', facade: 'Fachada', insulation: 'Aislamiento',
      pool: 'Piscina', garden: 'Jardín', other: 'Otros'
    };
    return labels[category] || category;
  },
  
  formatDate(dateStr) {
    if (!dateStr) return 'No programado';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  },
  
  renderLoading() {
    return `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="spinner mx-auto mb-4"></div>
          <p class="text-urba-500">Cargando...</p>
        </div>
      </div>
    `;
  },
  
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
      type === 'success' ? 'bg-green-600 text-white' : 
      type === 'error' ? 'bg-red-600 text-white' : 'bg-urba-800 text-white'
    }`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  // =============================================
  // GESTIÓN DE MEDIOS (FOTOS/VÍDEOS)
  // =============================================
  
  // Estado de medios
  mediaState: {
    propertyMedia: [],
    maintenanceMedia: {},
    uploading: false
  },
  
  // Cargar medios del usuario
  async loadUserMedia() {
    try {
      const [propRes, maintRes] = await Promise.all([
        axios.get('/api/media/property'),
        axios.get('/api/media/maintenance')
      ]);
      
      this.state.propertyMedia = propRes.data.data || [];
      
      // Agrupar medios de mantenimiento por categoría
      const maintMedia = maintRes.data.data || [];
      this.mediaState.maintenanceMedia = {};
      maintMedia.forEach(m => {
        if (!this.mediaState.maintenanceMedia[m.category]) {
          this.mediaState.maintenanceMedia[m.category] = [];
        }
        this.mediaState.maintenanceMedia[m.category].push(m);
      });
      
    } catch (error) {
      console.error('Error loading media:', error);
    }
  },
  
  // Obtener conteo de medios por categoría de mantenimiento
  getMaintenanceMediaCount(category) {
    return (this.mediaState.maintenanceMedia[category] || []).length;
  },
  
  // Mostrar modal de subida de medios
  showMediaUploadModal(type, category = 'general') {
    const categoryLabels = {
      general: 'General', exterior: 'Exterior', interior: 'Interior',
      garden: 'Jardín', pool: 'Piscina', garage: 'Garaje',
      roof: 'Cubierta/Tejado', electricity: 'Electricidad', plumbing: 'Fontanería',
      boiler: 'Caldera', facade: 'Fachada', insulation: 'Aislamiento', other: 'Otro'
    };
    
    const title = type === 'property' 
      ? 'Subir foto/vídeo de la vivienda' 
      : `Subir foto/vídeo de ${categoryLabels[category] || category}`;
    
    const modal = document.createElement('div');
    modal.id = 'media-upload-modal';
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl">
        <div class="gradient-bg px-6 py-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">${title}</h3>
            <button onclick="App.closeMediaUploadModal()" class="text-white/80 hover:text-white">
              <i class="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <!-- Preview de imagen/vídeo -->
          <div id="media-upload-preview" class="hidden mb-4">
            <img id="media-preview-img" src="" class="max-h-48 mx-auto rounded-lg" alt="Preview">
            <video id="media-preview-video" src="" class="max-h-48 mx-auto rounded-lg hidden" controls></video>
          </div>
          
          <!-- Área de upload -->
          <div id="media-upload-area" class="border-2 border-dashed border-urba-300 rounded-xl p-8 text-center hover:border-urba-500 transition cursor-pointer"
               onclick="document.getElementById('media-file-input').click()">
            <input type="file" id="media-file-input" accept="image/*,video/*" class="hidden" 
                   onchange="App.handleMediaFileSelect(event, '${type}', '${category}')">
            <i class="fas fa-cloud-upload-alt text-4xl text-urba-400 mb-3"></i>
            <p class="text-urba-600 font-medium">Pulsa para seleccionar archivo</p>
            <p class="text-urba-400 text-sm mt-1">Imágenes o vídeos (máx. 10MB)</p>
          </div>
          
          ${type === 'property' ? `
            <div class="mt-4">
              <label class="block text-sm font-medium text-urba-700 mb-2">Categoría</label>
              <select id="media-category-select" class="w-full px-4 py-2 border border-urba-200 rounded-lg">
                <option value="general">General</option>
                <option value="exterior">Exterior</option>
                <option value="interior">Interior</option>
                <option value="garden">Jardín</option>
                <option value="pool">Piscina</option>
                <option value="garage">Garaje</option>
                <option value="other">Otro</option>
              </select>
            </div>
          ` : ''}
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-urba-700 mb-2">Descripción (opcional)</label>
            <input type="text" id="media-description-input" 
                   class="w-full px-4 py-2 border border-urba-200 rounded-lg"
                   placeholder="Ej: Vista desde el jardín">
          </div>
          
          <div class="mt-6 flex gap-3">
            <button onclick="App.closeMediaUploadModal()" 
                    class="flex-1 px-4 py-3 border border-urba-300 rounded-lg text-urba-700 font-medium hover:bg-urba-50 transition">
              Cancelar
            </button>
            <button id="media-upload-btn" onclick="App.uploadMediaFile('${type}', '${category}')" 
                    class="flex-1 gradient-bg text-white px-4 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                    disabled>
              <i class="fas fa-upload mr-2"></i>
              Subir
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },
  
  closeMediaUploadModal() {
    document.getElementById('media-upload-modal')?.remove();
    this.mediaState.pendingUpload = null;
  },
  
  handleMediaFileSelect(event, type, category) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('El archivo es demasiado grande (máx. 10MB)', 'error');
      return;
    }
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      this.showToast('Solo se permiten imágenes y vídeos', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Full = e.target.result;
      const base64 = base64Full.split(',')[1];
      
      // Guardar para subir
      this.mediaState.pendingUpload = {
        base64,
        type: isImage ? 'image' : 'video',
        fileName: file.name
      };
      
      // Mostrar preview
      const previewContainer = document.getElementById('media-upload-preview');
      const imgPreview = document.getElementById('media-preview-img');
      const videoPreview = document.getElementById('media-preview-video');
      const uploadArea = document.getElementById('media-upload-area');
      const uploadBtn = document.getElementById('media-upload-btn');
      
      if (previewContainer) previewContainer.classList.remove('hidden');
      if (uploadArea) uploadArea.classList.add('hidden');
      
      if (isImage) {
        imgPreview.src = base64Full;
        imgPreview.classList.remove('hidden');
        videoPreview.classList.add('hidden');
      } else {
        videoPreview.src = base64Full;
        videoPreview.classList.remove('hidden');
        imgPreview.classList.add('hidden');
      }
      
      if (uploadBtn) uploadBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  },
  
  async uploadMediaFile(type, category) {
    if (!this.mediaState.pendingUpload) return;
    
    const uploadBtn = document.getElementById('media-upload-btn');
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Subiendo...';
    }
    
    try {
      const description = document.getElementById('media-description-input')?.value || '';
      const selectedCategory = type === 'property' 
        ? document.getElementById('media-category-select')?.value || 'general'
        : category;
      
      const endpoint = type === 'property' ? '/api/media/property' : '/api/media/maintenance';
      const payload = {
        media_base64: this.mediaState.pendingUpload.base64,
        media_type: this.mediaState.pendingUpload.type,
        title: this.mediaState.pendingUpload.fileName,
        description,
        category: selectedCategory
      };
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data.success) {
        this.showToast('Archivo subido correctamente', 'success');
        this.closeMediaUploadModal();
        await this.loadUserMedia();
        this.render();
      } else {
        throw new Error(response.data.error);
      }
      
    } catch (error) {
      console.error('Error uploading media:', error);
      this.showToast(error.response?.data?.error || 'Error al subir el archivo', 'error');
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Subir';
      }
    }
  },
  
  async viewMedia(type, id) {
    try {
      const response = await axios.get(`/api/media/${type}/${id}`);
      if (response.data.success && response.data.data) {
        const media = response.data.data;
        const isImage = media.media_type === 'image';
        
        const modal = document.createElement('div');
        modal.id = 'media-view-modal';
        modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
          <div class="relative max-w-4xl max-h-[90vh]">
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="absolute -top-10 right-0 text-white text-xl hover:text-gray-300">
              <i class="fas fa-times"></i> Cerrar
            </button>
            ${isImage 
              ? `<img src="data:image/jpeg;base64,${media.media_base64}" class="max-h-[85vh] rounded-lg" alt="${media.title || 'Imagen'}">`
              : `<video src="data:video/mp4;base64,${media.media_base64}" class="max-h-[85vh] rounded-lg" controls autoplay></video>`
            }
            ${media.description ? `<p class="text-white text-center mt-3">${media.description}</p>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
      }
    } catch (error) {
      this.showToast('Error al cargar el archivo', 'error');
    }
  },
  
  async deleteMedia(type, id) {
    if (!confirm('¿Eliminar este archivo?')) return;
    
    try {
      const response = await axios.delete(`/api/media/${type}/${id}`);
      if (response.data.success) {
        this.showToast('Archivo eliminado', 'success');
        await this.loadUserMedia();
        this.render();
      }
    } catch (error) {
      this.showToast('Error al eliminar', 'error');
    }
  },
  
  async analyzeMediaWithChari(type, id) {
    try {
      // Obtener el media
      const mediaResponse = await axios.get(`/api/media/for-analysis/${type}/${id}`);
      if (!mediaResponse.data.success) {
        throw new Error('No se pudo obtener el archivo');
      }
      
      const media = mediaResponse.data.data;
      
      if (media.media_type !== 'image') {
        this.showToast('Solo se pueden analizar imágenes con Chari', 'info');
        return;
      }
      
      // Navegar a Chari y enviar la imagen para análisis
      this.navigate('chari');
      
      // Esperar a que se renderice el chat
      setTimeout(async () => {
        // Añadir la imagen al estado para enviar
        this.selectedImageBase64 = media.media_base64;
        
        // Simular envío con contexto
        const contextMsg = media.category 
          ? `Analiza esta imagen de ${media.category} de mi vivienda` 
          : 'Analiza esta imagen de mi vivienda';
        
        const input = document.getElementById('chat-input');
        if (input) {
          input.value = contextMsg;
          // Disparar submit
          document.getElementById('chat-form')?.dispatchEvent(new Event('submit'));
        }
      }, 500);
      
    } catch (error) {
      console.error('Error analyzing media:', error);
      this.showToast('Error al analizar el archivo', 'error');
    }
  },

  // =============================================
  // MI VIVIENDA
  // =============================================
  renderProperty() {
    const p = this.state.property;
    
    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
            <h2 class="text-xl font-semibold text-urba-900">
              <i class="fas fa-home mr-2 text-urba-500"></i>
              Datos de mi vivienda
            </h2>
            <p class="text-sm text-urba-500 mt-1">Configura la información de tu chalet</p>
          </div>
          
          <form id="property-form" class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Nombre identificativo</label>
                <input type="text" name="name" value="${p?.name || ''}" 
                       class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                       placeholder="Ej: Mi chalet">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Urbanización</label>
                <select name="urbanization" class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500">
                  <option value="">Selecciona...</option>
                  ${['Cerro Alarcón', 'Cerro Alarcón Ampliación', 'El Paraíso', 'Puentelasierra', 'Mirador del Romero', 'La Esperanza', 'La Pizarrera', 'Mojadillas', 'Montemorillo', 'Los Pinos', 'Otra'].map(u => 
                    `<option value="${u}" ${p?.urbanization === u ? 'selected' : ''}>${u}</option>`
                  ).join('')}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Tipo de vivienda</label>
                <select name="property_type" class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500">
                  <option value="">Selecciona...</option>
                  ${['Chalet independiente', 'Chalet pareado', 'Chalet adosado', 'Casa de campo', 'Villa', 'Bungalow', 'Casa tradicional', 'Otro'].map(t => 
                    `<option value="${t}" ${p?.property_type === t ? 'selected' : ''}>${t}</option>`
                  ).join('')}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Año de construcción</label>
                <input type="number" name="year_built" value="${p?.year_built || ''}" min="1900" max="2025"
                       class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                       placeholder="Ej: 1995">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Superficie (m²)</label>
                <input type="number" name="square_meters" value="${p?.square_meters || ''}" min="50" max="2000"
                       class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                       placeholder="Ej: 200">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Última reforma integral</label>
                <input type="number" name="last_integral_reform" value="${p?.last_integral_reform || ''}" min="1970" max="2025"
                       class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                       placeholder="Ej: 2010">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-urba-700 mb-2">Dirección</label>
              <input type="text" name="address" value="${p?.address || ''}" 
                     class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                     placeholder="Calle, número, Valdemorillo">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-urba-700 mb-2">Notas</label>
              <textarea name="notes" rows="3" 
                        class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                        placeholder="Observaciones adicionales sobre tu vivienda...">${p?.notes || ''}</textarea>
            </div>
            
            <div class="pt-4 border-t border-urba-100">
              <button type="submit" 
                      class="w-full md:w-auto bg-urba-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-urba-800 transition">
                <i class="fas fa-save mr-2"></i>
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
        
        <!-- Galería de fotos/vídeos de la vivienda -->
        ${this.renderPropertyGallery()}
        
        <!-- Botón Publicar en InmoUrba -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                🏠
              </div>
              <div>
                <h3 class="text-lg font-bold">¿Quieres vender o alquilar tu vivienda?</h3>
                <p class="text-white/80 text-sm">Publica gratis en InmoUrba y llega a todos los vecinos</p>
              </div>
            </div>
            <button onclick="App.showPublishInmoUrbaModal()" 
                    class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center">
              <i class="fas fa-bullhorn mr-2"></i>
              Publicar Gratis
            </button>
          </div>
        </div>
        
        <!-- Instalaciones -->
        ${this.renderInstallations()}
      </div>
    `;
  },
  
  renderInstallations() {
    const installations = this.state.property?.installations || [];
    
    const types = [
      { type: 'electricity', label: 'Electricidad', icon: 'bolt' },
      { type: 'plumbing', label: 'Fontanería', icon: 'faucet' },
      { type: 'heating', label: 'Calefacción', icon: 'fire' },
      { type: 'insulation', label: 'Aislamiento', icon: 'thermometer-half' },
      { type: 'roof', label: 'Cubierta', icon: 'home' },
      { type: 'facade', label: 'Fachada', icon: 'building' }
    ];
    
    return `
      <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
        <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
          <h3 class="font-semibold text-urba-900">
            <i class="fas fa-cogs mr-2 text-urba-500"></i>
            Estado de instalaciones
          </h3>
          <p class="text-sm text-urba-500 mt-1">Indica el estado percibido de cada instalación</p>
        </div>
        
        <div class="p-6 space-y-4">
          ${types.map(t => {
            const inst = installations.find(i => i.type === t.type) || {};
            return `
              <div class="p-4 bg-urba-50 rounded-lg">
                <div class="flex items-center justify-between flex-wrap gap-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <i class="fas fa-${t.icon} text-urba-600"></i>
                    </div>
                    <div>
                      <p class="font-medium text-urba-900">${t.label}</p>
                      <p class="text-xs text-urba-500">${inst.year_updated ? 'Actualizada en ' + inst.year_updated : 'Sin actualizar'}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <select onchange="App.updateInstallation('${t.type}', this.value)" 
                            class="px-3 py-2 border border-urba-200 rounded-lg text-sm focus:ring-2 focus:ring-urba-500">
                      <option value="excellent" ${inst.perceived_state === 'excellent' ? 'selected' : ''}>Excelente</option>
                      <option value="good" ${inst.perceived_state === 'good' ? 'selected' : ''}>Bueno</option>
                      <option value="regular" ${inst.perceived_state === 'regular' ? 'selected' : ''}>Regular</option>
                      <option value="needs_attention" ${inst.perceived_state === 'needs_attention' ? 'selected' : ''}>Necesita atención</option>
                    </select>
                    
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" ${inst.is_updated ? 'checked' : ''} 
                             onchange="App.updateInstallation('${t.type}', null, this.checked)"
                             class="w-4 h-4 text-urba-600 rounded focus:ring-urba-500">
                      <span class="text-sm text-urba-600">Actualizada</span>
                    </label>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },
  
  // =============================================
  // GALERÍA DE MEDIOS DE LA VIVIENDA
  // =============================================
  
  renderPropertyGallery() {
    const mediaItems = this.state.propertyMedia || [];
    
    return `
      <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
        <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-urba-900">
                <i class="fas fa-images mr-2 text-urba-500"></i>
                Fotos y vídeos de tu vivienda
              </h3>
              <p class="text-sm text-urba-500 mt-1">Sube imágenes para que Chari pueda asesorarte mejor</p>
            </div>
            <button onclick="App.showMediaUploadModal('property')" 
                    class="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center">
              <i class="fas fa-plus mr-2"></i>
              Añadir
            </button>
          </div>
        </div>
        
        <div class="p-4">
          ${mediaItems.length === 0 ? `
            <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <i class="fas fa-camera text-4xl text-gray-300 mb-3"></i>
              <p class="text-gray-500 mb-2">No hay fotos ni vídeos aún</p>
              <p class="text-gray-400 text-sm mb-4">Sube fotos de tu vivienda para que Chari pueda darte consejos más precisos</p>
              <button onclick="App.showMediaUploadModal('property')" 
                      class="text-green-600 font-medium hover:text-green-700">
                <i class="fas fa-upload mr-1"></i>
                Subir primera foto
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              ${mediaItems.map(item => `
                <div class="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  ${item.media_type === 'image' 
                    ? `<div class="w-full h-full bg-gradient-to-br from-urba-100 to-urba-200 flex items-center justify-center">
                         <i class="fas fa-image text-2xl text-urba-400"></i>
                       </div>`
                    : `<div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                         <i class="fas fa-video text-2xl text-blue-400"></i>
                       </div>`
                  }
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button onclick="App.viewMedia('property', ${item.id})" 
                            class="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100" title="Ver">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="App.analyzeMediaWithChari('property', ${item.id})" 
                            class="p-2 bg-green-500 rounded-full text-white hover:bg-green-600" title="Analizar con Chari">
                      <i class="fas fa-comment-dots"></i>
                    </button>
                    <button onclick="App.deleteMedia('property', ${item.id})" 
                            class="p-2 bg-red-500 rounded-full text-white hover:bg-red-600" title="Eliminar">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p class="text-white text-xs truncate">${item.title || item.category || 'Sin título'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },
  
  // =============================================
  // MANTENIMIENTO - Sistema de potenciómetros
  // =============================================
  
  // Plazos de revisión recomendados en años
  getMaintenanceCycles() {
    return {
      roof: { years: 2.5, label: 'Cubierta/Tejado', icon: 'home', frequency: 'Cada 2-3 años' },
      electricity: { years: 10, label: 'Electricidad', icon: 'bolt', frequency: 'Cada 10 años' },
      plumbing: { years: 5, label: 'Fontanería', icon: 'faucet', frequency: 'Cada 5 años' },
      boiler: { years: 1, label: 'Caldera', icon: 'fire', frequency: 'Anual (obligatorio)' },
      facade: { years: 7.5, label: 'Fachada', icon: 'building', frequency: 'Cada 5-10 años' },
      insulation: { years: 15, label: 'Aislamiento', icon: 'thermometer-half', frequency: 'Según necesidad' },
      pool: { years: 1, label: 'Piscina', icon: 'swimming-pool', frequency: 'Anual (pre-temporada)' },
      garden: { years: 0.25, label: 'Jardín', icon: 'leaf', frequency: 'Trimestral' }
    };
  },
  
  // Calcula el porcentaje del potenciómetro (0-100)
  // 0% = vencido hace mucho (rojo), 100% = recién hecho (verde)
  calculateMaintenanceLevel(lastChecked, cycleYears, status) {
    // Si no hay datos, devolver null (sin rellenar)
    if (!lastChecked) return null;
    
    // Si necesita reparación, siempre rojo
    if (status === 'needs_repair') return 5;
    
    const lastDate = new Date(lastChecked);
    const now = new Date();
    const daysSince = (now - lastDate) / (1000 * 60 * 60 * 24);
    const cycleDays = cycleYears * 365;
    
    // Porcentaje de tiempo restante hasta próxima revisión
    const percentUsed = (daysSince / cycleDays) * 100;
    const percentRemaining = Math.max(0, 100 - percentUsed);
    
    // Si está vencido, dar un mínimo del 5%
    if (percentRemaining <= 0) return 5;
    
    return Math.min(100, percentRemaining);
  },
  
  // Obtiene el color según el nivel del potenciómetro
  getPotentiometerColor(level) {
    if (level === null) return { main: 'rgba(156,163,175,0.3)', text: 'gray-400' };
    if (level <= 20) return { main: '#ef4444', text: 'red-600' }; // Rojo
    if (level <= 40) return { main: '#f97316', text: 'orange-500' }; // Naranja
    if (level <= 60) return { main: '#eab308', text: 'yellow-500' }; // Amarillo
    if (level <= 80) return { main: '#84cc16', text: 'lime-500' }; // Lima
    return { main: '#22c55e', text: 'green-500' }; // Verde
  },
  
  // Mensaje según el estado
  getMaintenanceMessage(level, cycleName) {
    if (level === null) return { icon: 'question-circle', text: 'Sin datos - pulsa para añadir información', urgent: false };
    if (level <= 20) return { icon: 'exclamation-triangle', text: '¡Revisión urgente! Plazo muy sobrepasado', urgent: true };
    if (level <= 40) return { icon: 'clock', text: 'Conviene programar revisión pronto', urgent: true };
    if (level <= 60) return { icon: 'calendar-alt', text: 'Revisión recomendada en los próximos meses', urgent: false };
    if (level <= 80) return { icon: 'check-circle', text: 'Todo correcto, próxima revisión dentro del plazo', urgent: false };
    return { icon: 'thumbs-up', text: '¡Perfecto! Revisión reciente', urgent: false };
  },
  
  renderMaintenance() {
    const maintenances = this.state.maintenances || [];
    const cycles = this.getMaintenanceCycles();
    const categories = Object.keys(cycles);
    
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
            <h2 class="text-xl font-semibold text-urba-900">
              <i class="fas fa-clipboard-check mr-2 text-urba-500"></i>
              Control de mantenimiento
            </h2>
            <p class="text-sm text-urba-500 mt-1">Pulsa en cada área para añadir o actualizar información</p>
          </div>
          
          <!-- Leyenda de colores -->
          <div class="px-6 py-3 bg-gray-50 border-b border-urba-100 flex flex-wrap gap-4 text-xs">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-500"></span> Urgente</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-orange-500"></span> Revisar pronto</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-yellow-500"></span> Planificar</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-lime-500"></span> Bien</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-green-500"></span> Perfecto</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-gray-300"></span> Sin datos</span>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${categories.map(catKey => {
                const cat = cycles[catKey];
                const m = maintenances.find(x => x.category === catKey) || {};
                const level = this.calculateMaintenanceLevel(m.last_checked, cat.years, m.status);
                const color = this.getPotentiometerColor(level);
                const message = this.getMaintenanceMessage(level, cat.label);
                const hasData = level !== null;
                
                return `
                  <div class="maintenance-card border border-urba-200 rounded-xl p-4 hover:shadow-lg transition relative overflow-hidden"
                       style="min-height: 160px;">
                    
                    <!-- Capa blanquecina para sin datos -->
                    ${!hasData ? `
                      <div class="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center cursor-pointer"
                           onclick="App.openMaintenanceModal('${catKey}', ${m.id || 'null'})">
                        <div class="text-center p-4">
                          <i class="fas fa-plus-circle text-3xl text-urba-400 mb-2"></i>
                          <p class="text-sm text-urba-500">Pulsa para añadir datos</p>
                        </div>
                      </div>
                    ` : ''}
                    
                    <!-- Contenido de la tarjeta -->
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center space-x-3 cursor-pointer" onclick="App.openMaintenanceModal('${catKey}', ${m.id || 'null'})">
                        <div class="w-12 h-12 bg-urba-100 rounded-xl flex items-center justify-center">
                          <i class="fas fa-${cat.icon} text-xl text-urba-600"></i>
                        </div>
                        <div>
                          <p class="font-semibold text-urba-900">${cat.label}</p>
                          <p class="text-xs text-urba-500">${cat.frequency}</p>
                        </div>
                      </div>
                      <!-- Botón de cámara para subir fotos -->
                      <button onclick="event.stopPropagation(); App.showMediaUploadModal('maintenance', '${catKey}')" 
                              class="p-2 bg-urba-100 hover:bg-urba-200 rounded-lg text-urba-600 transition z-20 relative"
                              title="Subir foto/vídeo de ${cat.label}">
                        <i class="fas fa-camera"></i>
                      </button>
                    </div>
                    
                    <!-- Potenciómetro visual -->
                    <div class="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-3 cursor-pointer" 
                         onclick="App.openMaintenanceModal('${catKey}', ${m.id || 'null'})">
                      <!-- Degradado de fondo (siempre visible) -->
                      <div class="absolute inset-0 opacity-30"
                           style="background: linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #84cc16 75%, #22c55e 100%);">
                      </div>
                      <!-- Barra de llenado -->
                      <div class="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                           style="width: ${hasData ? level : 0}%; background: linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #84cc16 75%, #22c55e 100%); background-size: ${100 / (level || 1) * 100}% 100%;">
                      </div>
                      <!-- Indicador de nivel -->
                      ${hasData ? `
                        <div class="absolute inset-y-0 flex items-center justify-end pr-2 text-white text-xs font-bold drop-shadow"
                             style="width: ${Math.max(level, 15)}%;">
                          ${Math.round(level)}%
                        </div>
                      ` : ''}
                    </div>
                    
                    <!-- Mensaje de estado -->
                    <div class="flex items-center gap-2 text-sm ${message.urgent ? 'text-red-600 font-medium' : 'text-urba-600'} cursor-pointer"
                         onclick="App.openMaintenanceModal('${catKey}', ${m.id || 'null'})">
                      <i class="fas fa-${message.icon}"></i>
                      <span>${message.text}</span>
                    </div>
                    
                    <!-- Info de última revisión y fotos -->
                    <div class="flex items-center justify-between mt-2">
                      ${m.last_checked ? `
                        <p class="text-xs text-urba-400">
                          Última revisión: ${this.formatDate(m.last_checked)}
                        </p>
                      ` : '<span></span>'}
                      <!-- Contador de fotos si hay -->
                      ${this.getMaintenanceMediaCount(catKey) > 0 ? `
                        <span class="text-xs bg-urba-100 text-urba-600 px-2 py-1 rounded-full">
                          <i class="fas fa-image mr-1"></i>${this.getMaintenanceMediaCount(catKey)}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        
        <!-- Resumen del estado -->
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 p-6">
          <h3 class="font-semibold text-urba-900 mb-4">
            <i class="fas fa-chart-pie mr-2 text-urba-500"></i>
            Resumen del estado de mantenimiento
          </h3>
          ${this.renderMaintenanceSummary(maintenances, cycles)}
        </div>
      </div>
    `;
  },
  
  renderMaintenanceSummary(maintenances, cycles) {
    const categories = Object.keys(cycles);
    let completed = 0, urgent = 0, pending = 0, noData = 0;
    
    categories.forEach(catKey => {
      const cat = cycles[catKey];
      const m = maintenances.find(x => x.category === catKey);
      const level = this.calculateMaintenanceLevel(m?.last_checked, cat.years, m?.status);
      
      if (level === null) noData++;
      else if (level <= 40) urgent++;
      else if (level <= 70) pending++;
      else completed++;
    });
    
    const total = categories.length;
    
    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-green-50 rounded-xl">
          <p class="text-2xl font-bold text-green-600">${completed}</p>
          <p class="text-sm text-green-700">Al día</p>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-xl">
          <p class="text-2xl font-bold text-yellow-600">${pending}</p>
          <p class="text-sm text-yellow-700">A planificar</p>
        </div>
        <div class="text-center p-4 bg-red-50 rounded-xl">
          <p class="text-2xl font-bold text-red-600">${urgent}</p>
          <p class="text-sm text-red-700">Urgentes</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-xl">
          <p class="text-2xl font-bold text-gray-500">${noData}</p>
          <p class="text-sm text-gray-600">Sin datos</p>
        </div>
      </div>
      <p class="text-sm text-urba-500 mt-4 text-center">
        Completa la información de las ${noData} áreas sin datos para obtener un análisis técnico más preciso
      </p>
    `;
  },
  
  // Modal para añadir/editar mantenimiento
  async openMaintenanceModal(category, existingId) {
    const cycles = this.getMaintenanceCycles();
    const cat = cycles[category];
    const maintenances = this.state.maintenances || [];
    const existing = maintenances.find(m => m.category === category) || {};
    
    const modal = document.createElement('div');
    modal.id = 'maintenance-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-urba-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-${cat.icon} text-xl text-urba-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-urba-900">${cat.label}</h3>
              <p class="text-sm text-urba-500">${cat.frequency}</p>
            </div>
          </div>
        </div>
        
        <form id="maintenance-form" class="p-6 space-y-4">
          <input type="hidden" name="category" value="${category}">
          <input type="hidden" name="id" value="${existing.id || ''}">
          
          <div>
            <label class="block text-sm font-medium text-urba-700 mb-2">
              <i class="fas fa-calendar-check mr-1"></i>
              Fecha de última revisión/mantenimiento
            </label>
            <input type="date" name="last_checked" 
                   value="${existing.last_checked ? existing.last_checked.split('T')[0] : ''}"
                   class="w-full px-4 py-3 border border-urba-200 rounded-xl focus:ring-2 focus:ring-urba-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-urba-700 mb-2">
              <i class="fas fa-clipboard-list mr-1"></i>
              Estado actual
            </label>
            <select name="status" 
                    class="w-full px-4 py-3 border border-urba-200 rounded-xl focus:ring-2 focus:ring-urba-500 focus:border-transparent">
              <option value="checked" ${existing.status === 'checked' ? 'selected' : ''}>✅ Revisado / Al día</option>
              <option value="repaired" ${existing.status === 'repaired' ? 'selected' : ''}>🔧 Reparado recientemente</option>
              <option value="pending" ${existing.status === 'pending' ? 'selected' : ''}>⏳ Pendiente de revisión</option>
              <option value="needs_repair" ${existing.status === 'needs_repair' ? 'selected' : ''}>🔴 Necesita reparación</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-urba-700 mb-2">
              <i class="fas fa-sticky-note mr-1"></i>
              Observaciones (opcional)
            </label>
            <textarea name="notes" rows="3" 
                      placeholder="Añade cualquier detalle relevante..."
                      class="w-full px-4 py-3 border border-urba-200 rounded-xl focus:ring-2 focus:ring-urba-500 focus:border-transparent resize-none">${existing.notes || ''}</textarea>
          </div>
          
          <div class="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <i class="fas fa-info-circle mr-1"></i>
            <strong>Recomendación:</strong> Para ${cat.label.toLowerCase()}, se recomienda una revisión ${cat.frequency.toLowerCase()}.
          </div>
          
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="App.closeMaintenanceModal()"
                    class="flex-1 px-4 py-3 border border-urba-200 rounded-xl text-urba-600 hover:bg-urba-50 transition">
              Cancelar
            </button>
            <button type="submit"
                    class="flex-1 px-4 py-3 gradient-bg text-white rounded-xl font-medium hover:opacity-90 transition">
              <i class="fas fa-save mr-1"></i>
              Guardar
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listener para el formulario
    document.getElementById('maintenance-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveMaintenanceData(new FormData(e.target));
    });
  },
  
  closeMaintenanceModal() {
    const modal = document.getElementById('maintenance-modal');
    if (modal) modal.remove();
  },
  
  async saveMaintenanceData(formData) {
    const data = Object.fromEntries(formData);
    const existingId = data.id;
    
    try {
      let response;
      
      if (existingId) {
        // Actualizar existente
        response = await axios.put(`/api/maintenances/${existingId}`, {
          status: data.status,
          last_checked: data.last_checked || null,
          notes: data.notes || null
        }, {
          headers: { Authorization: `Bearer ${this.state.token}` }
        });
      } else {
        // Crear nuevo
        const propertyId = this.state.dashboard?.property?.id;
        if (!propertyId) {
          this.showToast('Primero debes configurar tu vivienda', 'error');
          return;
        }
        
        response = await axios.post('/api/maintenances', {
          property_id: propertyId,
          category: data.category,
          status: data.status,
          last_checked: data.last_checked || null,
          notes: data.notes || null
        }, {
          headers: { Authorization: `Bearer ${this.state.token}` }
        });
      }
      
      if (response.data.success) {
        // Recargar datos
        await this.loadDashboard();
        this.closeMaintenanceModal();
        this.showToast('Información guardada correctamente', 'success');
        this.render();
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
      this.showToast('Error al guardar', 'error');
    }
  },
  
  // =============================================
  // ESTIMACIONES
  // =============================================
  renderEstimates() {
    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
            <h2 class="text-xl font-semibold text-urba-900">
              <i class="fas fa-calculator mr-2 text-urba-500"></i>
              Estimaciones orientativas
            </h2>
            <p class="text-sm text-urba-500 mt-1">Calcula rangos aproximados para tus proyectos</p>
          </div>
          
          <form id="estimate-form" class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Tipo de intervención</label>
                <select name="intervention_type" required
                        class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500">
                  <option value="">Selecciona...</option>
                  <optgroup label="Baños">
                    <option value="bathroom_small">Baño pequeño (parcial)</option>
                    <option value="bathroom_complete">Baño completo (integral)</option>
                  </optgroup>
                  <optgroup label="Cocina y suelos">
                    <option value="kitchen">Cocina</option>
                    <option value="flooring">Suelos</option>
                  </optgroup>
                  <optgroup label="Exterior">
                    <option value="roof">Cubierta/Tejado</option>
                    <option value="facade">Fachada</option>
                    <option value="pool">Piscina</option>
                  </optgroup>
                  <optgroup label="Instalaciones">
                    <option value="electricity">Instalación eléctrica</option>
                    <option value="plumbing">Fontanería</option>
                    <option value="heating">Calefacción</option>
                    <option value="insulation_windows">Ventanas</option>
                    <option value="insulation_walls">Aislamiento paredes</option>
                  </optgroup>
                  <optgroup label="Reforma integral">
                    <option value="integral_partial">Reforma integral parcial</option>
                    <option value="integral_complete">Reforma integral completa</option>
                  </optgroup>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">
                  Metros cuadrados / Unidades
                </label>
                <input type="number" name="square_meters" min="1" max="1000" value="1"
                       class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500"
                       placeholder="Ej: 150">
                <p class="text-xs text-urba-400 mt-1">m² o unidades según intervención</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Nivel de acabados</label>
                <select name="finish_level" 
                        class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500">
                  <option value="basic">Básico - Funcional</option>
                  <option value="medium" selected>Medio - Equilibrado</option>
                  <option value="premium">Premium - Alta gama</option>
                </select>
              </div>
            </div>
            
            <button type="submit" 
                    class="w-full md:w-auto bg-urba-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-urba-800 transition">
              <i class="fas fa-search-dollar mr-2"></i>
              Calcular estimación
            </button>
          </form>
        </div>
        
        <!-- Resultado -->
        <div id="estimate-result" class="hidden">
          <!-- Se rellena dinámicamente -->
        </div>
        
        <!-- Historial -->
        <div id="estimate-history" class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
            <h3 class="font-semibold text-urba-900">
              <i class="fas fa-history mr-2 text-urba-500"></i>
              Estimaciones guardadas
            </h3>
          </div>
          <div class="p-6">
            <p class="text-urba-500 text-center py-4">Las estimaciones guardadas aparecerán aquí</p>
          </div>
        </div>
      </div>
    `;
  },
  
  // =============================================
  // VALORACIÓN ESTRATÉGICA
  // =============================================
  renderStrategic() {
    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
            <h2 class="text-xl font-semibold text-urba-900">
              <i class="fas fa-chess mr-2 text-urba-500"></i>
              Orientación estratégica
            </h2>
            <p class="text-sm text-urba-500 mt-1">Análisis para tomar mejores decisiones sobre tu vivienda</p>
          </div>
          
          <form id="strategic-form" class="p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-urba-700 mb-3">¿Estás pensando en vender?</label>
              <div class="flex space-x-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="wants_to_sell" value="true" 
                         class="w-4 h-4 text-urba-600 focus:ring-urba-500">
                  <span class="text-urba-700">Sí, estoy valorándolo</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="wants_to_sell" value="false" checked
                         class="w-4 h-4 text-urba-600 focus:ring-urba-500">
                  <span class="text-urba-700">No, quiero mantenerla</span>
                </label>
              </div>
            </div>
            
            <div id="sell-options" class="hidden space-y-6">
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Horizonte temporal</label>
                <select name="time_horizon" 
                        class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500">
                  <option value="">Selecciona...</option>
                  <option value="immediate">Inmediato - Lo antes posible</option>
                  <option value="short_term">Corto plazo - 6 a 12 meses</option>
                  <option value="medium_term">Medio plazo - 1 a 3 años</option>
                  <option value="long_term">Largo plazo - Más de 3 años</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Estado actual de reforma</label>
                <select name="current_reform_level" 
                        class="w-full px-4 py-2 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500">
                  <option value="">Selecciona...</option>
                  <option value="none">Sin reformar - Estado original</option>
                  <option value="partial">Reforma parcial - Algunas zonas</option>
                  <option value="integral">Reforma integral antigua - Hace más de 10 años</option>
                  <option value="recent">Reforma reciente - Últimos 10 años</option>
                </select>
              </div>
            </div>
            
            <button type="submit" 
                    class="w-full md:w-auto bg-urba-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-urba-800 transition">
              <i class="fas fa-lightbulb mr-2"></i>
              Obtener orientación
            </button>
          </form>
        </div>
        
        <!-- Resultado -->
        <div id="strategic-result" class="hidden">
          <!-- Se rellena dinámicamente -->
        </div>
      </div>
    `;
  },
  
  // =============================================
  // CHARI - ASISTENTE
  // =============================================
  renderChari() {
    const conv = this.state.currentConversation;
    const messages = conv?.messages || [];
    
    // Verificar si Samuel fue ofrecido en la conversación
    const samuelOffered = conv?.samuel_contact_offered || messages.some(m => 
      m.role === 'assistant' && (m.content.includes('Samuel') || m.content.includes('WhatsApp'))
    );
    
    return `
      <div class="max-w-3xl mx-auto">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Header -->
          <div class="gradient-bg px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                <i class="fas fa-user-tie text-2xl text-white"></i>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-white">Chari</h2>
                <p class="text-white/80 text-sm">Tu asistente estratégica</p>
              </div>
            </div>
          </div>
          
          <!-- Mensajes -->
          <div id="chat-messages" class="chat-container overflow-y-auto p-6 space-y-4 bg-gray-50">
            ${messages.length === 0 ? `
              <div class="text-center py-6">
                <div class="w-20 h-20 bg-gradient-to-br from-pink-200 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i class="fas fa-user-tie text-3xl text-gray-600"></i>
                </div>
                <p class="text-gray-800 font-semibold text-lg">¡Hola ${this.state.user?.name?.split(' ')[0]}! 👋</p>
                <p class="text-gray-600 text-sm mt-3 max-w-md mx-auto">
                  Soy <strong>Chari</strong>, tu asesora personal de <strong>Más Urba</strong>. 
                  Llevo 8 años ayudando a vecinos de Valdemorillo con sus chalets.
                </p>
                <div class="mt-4 sm:mt-6 space-y-3 max-w-sm mx-auto px-2">
                  <p class="text-gray-500 text-xs sm:text-sm font-medium">¿Por dónde empezamos?</p>
                  <div class="grid grid-cols-2 gap-2">
                    <button onclick="App.sendQuickMessage('Quiero que me ayudes a rellenar los datos de mi vivienda')" 
                            class="text-left p-2 sm:p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-xs sm:text-sm quick-action-mobile">
                      <i class="fas fa-home text-green-500 mr-1 sm:mr-2"></i>
                      <span class="hidden sm:inline">Configurar mi vivienda</span>
                      <span class="sm:hidden">Mi vivienda</span>
                    </button>
                    <button onclick="App.sendQuickMessage('¿Cómo funciona la app y qué puedo hacer?')" 
                            class="text-left p-2 sm:p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-xs sm:text-sm quick-action-mobile">
                      <i class="fas fa-question-circle text-blue-500 mr-1 sm:mr-2"></i>
                      <span class="hidden sm:inline">Cómo funciona</span>
                      <span class="sm:hidden">Ayuda</span>
                    </button>
                    <button onclick="App.sendQuickMessage('Tengo una duda sobre una reforma en mi casa')" 
                            class="text-left p-2 sm:p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-xs sm:text-sm quick-action-mobile">
                      <i class="fas fa-tools text-amber-500 mr-1 sm:mr-2"></i>
                      <span class="hidden sm:inline">Preguntar reforma</span>
                      <span class="sm:hidden">Reforma</span>
                    </button>
                    <button onclick="App.sendQuickMessage('¿Cuánto vale mi casa y qué puedo hacer para aumentar su valor?')" 
                            class="text-left p-2 sm:p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-xs sm:text-sm quick-action-mobile">
                      <i class="fas fa-chart-line text-purple-500 mr-1 sm:mr-2"></i>
                      <span class="hidden sm:inline">Valorar mi chalet</span>
                      <span class="sm:hidden">Valorar</span>
                    </button>
                  </div>
                  <p class="text-gray-400 text-xs mt-3 sm:mt-4">
                    O escríbeme directamente 👇
                  </p>
                </div>
              </div>
            ` : messages.map(m => `
              <div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="message-bubble ${m.role === 'user' 
                  ? 'gradient-bg text-white rounded-2xl rounded-br-md' 
                  : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'} px-4 py-3">
                  <p class="text-sm whitespace-pre-line">${this.formatMessage(m.content)}</p>
                  <p class="text-xs ${m.role === 'user' ? 'text-white/70' : 'text-gray-400'} mt-1">
                    ${this.formatTime(m.timestamp)}
                  </p>
                </div>
              </div>
            `).join('')}
            <div id="typing-indicator" class="hidden flex justify-start">
              <div class="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Botón WhatsApp si Samuel fue ofrecido -->
          ${samuelOffered ? `
          <div class="px-4 py-3 bg-green-50 border-t border-green-100">
            <button onclick="App.openWhatsApp('Hola Samuel, vengo de hablar con Chari y me gustaría que revisaras mi vivienda.')" 
                    class="w-full whatsapp-btn text-white py-3 rounded-xl font-medium flex items-center justify-center">
              <i class="fab fa-whatsapp mr-2 text-lg"></i>
              Contactar con Samuel por WhatsApp
            </button>
          </div>
          ` : ''}
          
          <!-- Input -->
          <form id="chat-form" class="p-3 sm:p-4 bg-white border-t border-gray-100 chat-form-mobile">
            <!-- Preview de imagen seleccionada -->
            <div id="image-preview-container" class="hidden mb-2 sm:mb-3">
              <div class="relative inline-block">
                <img id="image-preview" src="" alt="Preview" class="max-h-24 sm:max-h-32 rounded-lg border border-gray-200">
                <button type="button" onclick="App.removeSelectedImage()" 
                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">Imagen adjunta</p>
            </div>
            
            <div class="flex items-center gap-2">
              <!-- Botón subir imagen -->
              <input type="file" id="image-input" accept="image/*" class="hidden" onchange="App.handleImageSelect(event)">
              <button type="button" onclick="document.getElementById('image-input').click()" 
                      class="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-green-600 transition flex items-center justify-center"
                      title="Adjuntar imagen">
                <i class="fas fa-camera text-sm sm:text-base"></i>
              </button>
              
              <input type="text" id="chat-input" 
                     class="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm sm:text-base"
                     placeholder="Escribe tu mensaje..."
                     autocomplete="off">
              <button type="submit" 
                      class="flex-shrink-0 w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-3 gradient-bg text-white rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center">
                <i class="fas fa-paper-plane text-sm sm:text-base"></i>
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2 text-center hidden sm:block">
              <i class="fas fa-image mr-1"></i> Puedes enviar fotos de tu vivienda para que Chari las analice
            </p>
          </form>
        </div>
      </div>
    `;
  },
  
  formatMessage(text) {
    // Convertir **texto** en negrita
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\n/g, '<br>');
  },
  
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  },
  
  // =============================================
  // EL PORCHE - Muro social vecinal
  // =============================================
  
  porcheState: {
    posts: [],
    currentPost: null,
    filter: 'all',
    page: 1,
    hasMore: true,
    loading: false,
    newPostImages: [],
    showComments: {}
  },
  
  porcheCategories: {
    all: { label: 'Todos', icon: '📋', color: 'gray' },
    general: { label: 'General', icon: '💬', color: 'gray' },
    recommendation: { label: 'Recomendación', icon: '⭐', color: 'yellow' },
    alert: { label: 'Aviso', icon: '⚠️', color: 'red' },
    event: { label: 'Evento', icon: '🎉', color: 'purple' }
  },

  renderPorche() {
    return `
      <div class="space-y-4 max-w-2xl mx-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center space-x-3">
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
              🏡
            </div>
            <div>
              <h2 class="text-2xl font-bold">El Porche</h2>
              <p class="text-white/80 text-sm">Tu comunidad de vecinos</p>
            </div>
          </div>
        </div>
        
        <!-- Crear nuevo post -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              ${this.state.user?.name?.charAt(0) || 'U'}
            </div>
            <div class="flex-1">
              <textarea id="new-post-content" 
                        placeholder="¿Qué quieres compartir con tus vecinos?"
                        class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        rows="3"
                        maxlength="2000"></textarea>
              
              <!-- Preview de imágenes -->
              <div id="post-images-preview" class="flex flex-wrap gap-2 mt-2 ${this.porcheState.newPostImages.length === 0 ? 'hidden' : ''}">
                ${this.porcheState.newPostImages.map((img, idx) => `
                  <div class="relative">
                    <img src="${img}" class="w-20 h-20 object-cover rounded-lg">
                    <button onclick="App.removePostImage(${idx})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
                  </div>
                `).join('')}
              </div>
              
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center space-x-2">
                  <!-- Selector de categoría -->
                  <select id="new-post-category" class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-500">
                    <option value="general">💬 General</option>
                    <option value="recommendation">⭐ Recomendación</option>
                    <option value="alert">⚠️ Aviso</option>
                    <option value="event">🎉 Evento</option>
                  </select>
                  
                  <!-- Botón añadir imagen -->
                  <input type="file" id="post-image-input" accept="image/*" class="hidden" onchange="App.handlePostImageSelect(event)">
                  <button onclick="document.getElementById('post-image-input').click()" 
                          class="text-gray-500 hover:text-amber-500 transition p-2" title="Añadir imagen">
                    <i class="fas fa-image"></i>
                  </button>
                </div>
                
                <button onclick="App.createPost()" 
                        class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition">
                  <i class="fas fa-paper-plane mr-1"></i> Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Filtros -->
        <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          ${Object.entries(this.porcheCategories).map(([key, cat]) => `
            <button onclick="App.filterPorchePosts('${key}')" 
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition
                           ${this.porcheState.filter === key 
                             ? 'bg-amber-500 text-white' 
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
              ${cat.icon} ${cat.label}
            </button>
          `).join('')}
        </div>
        
        <!-- Feed de posts -->
        <div id="porche-feed" class="space-y-4">
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        </div>
        
        <!-- Cargar más -->
        <div id="load-more-container" class="hidden">
          <button onclick="App.loadMorePosts()" 
                  class="w-full py-3 text-amber-600 hover:text-amber-700 font-medium text-sm">
            <i class="fas fa-chevron-down mr-2"></i>Cargar más publicaciones
          </button>
        </div>
      </div>
    `;
  },

  renderPorchePost(post) {
    const isOwner = post.user_id === this.state.user?.sub;
    const showComments = this.porcheState.showComments[post.id];
    const categoryInfo = this.porcheCategories[post.category] || this.porcheCategories.general;
    
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-post-id="${post.id}">
        <!-- Header del post -->
        <div class="p-4 pb-2">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${post.author_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p class="font-semibold text-gray-900">${post.author_name}</p>
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                  <span>${post.author_urbanization || 'Vecino'}</span>
                  <span>•</span>
                  <span>${this.timeAgo(post.created_at)}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 text-xs rounded-full ${this.getCategoryStyle(post.category)}">
                ${categoryInfo.icon} ${categoryInfo.label}
              </span>
              ${isOwner ? `
                <button onclick="App.deletePost(${post.id})" class="text-gray-400 hover:text-red-500 transition p-1">
                  <i class="fas fa-trash-alt text-sm"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Contenido -->
        <div class="px-4 pb-3">
          <p class="text-gray-800 whitespace-pre-wrap">${this.escapeHtml(post.content)}</p>
        </div>
        
        <!-- Imágenes -->
        ${post.images && post.images.length > 0 ? `
          <div class="px-4 pb-3">
            <div class="grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2">
              ${post.images.map(img => `
                <img src="${img}" class="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" 
                     onclick="App.viewImage('${img}')">
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Reacciones y stats -->
        <div class="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div class="flex items-center space-x-4">
            ${post.likes_count > 0 ? `<span>👍 ${post.likes_count}</span>` : ''}
            ${post.hearts_count > 0 ? `<span>❤️ ${post.hearts_count}</span>` : ''}
          </div>
          <span onclick="App.toggleComments(${post.id})" class="cursor-pointer hover:text-amber-600">
            ${post.comments_count || 0} comentario${post.comments_count !== 1 ? 's' : ''}
          </span>
        </div>
        
        <!-- Botones de acción -->
        <div class="px-4 py-2 border-t border-gray-100 flex items-center justify-around">
          <button onclick="App.reactToPost(${post.id}, 'like')" 
                  class="flex items-center space-x-2 px-4 py-2 rounded-lg transition hover:bg-gray-100 ${post.user_liked ? 'text-blue-500' : 'text-gray-600'}">
            <i class="fas fa-thumbs-up"></i>
            <span class="text-sm">Me gusta</span>
          </button>
          <button onclick="App.reactToPost(${post.id}, 'heart')" 
                  class="flex items-center space-x-2 px-4 py-2 rounded-lg transition hover:bg-gray-100 ${post.user_hearted ? 'text-red-500' : 'text-gray-600'}">
            <i class="fas fa-heart"></i>
            <span class="text-sm">Me encanta</span>
          </button>
          <button onclick="App.toggleComments(${post.id})" 
                  class="flex items-center space-x-2 px-4 py-2 rounded-lg transition hover:bg-gray-100 text-gray-600">
            <i class="fas fa-comment"></i>
            <span class="text-sm">Comentar</span>
          </button>
        </div>
        
        <!-- Sección de comentarios -->
        <div id="comments-section-${post.id}" class="${showComments ? '' : 'hidden'} border-t border-gray-100 bg-gray-50">
          <div class="p-4 space-y-3" id="comments-list-${post.id}">
            <!-- Los comentarios se cargarán dinámicamente -->
          </div>
          
          <!-- Input de nuevo comentario -->
          <div class="px-4 pb-4 flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              ${this.state.user?.name?.charAt(0) || 'U'}
            </div>
            <input type="text" 
                   id="comment-input-${post.id}"
                   placeholder="Escribe un comentario..."
                   class="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                   onkeypress="if(event.key==='Enter') App.addComment(${post.id})">
            <button onclick="App.addComment(${post.id})" 
                    class="text-amber-500 hover:text-amber-600 transition p-2">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  getCategoryStyle(category) {
    const styles = {
      general: 'bg-gray-100 text-gray-700',
      recommendation: 'bg-yellow-100 text-yellow-700',
      alert: 'bg-red-100 text-red-700',
      event: 'bg-purple-100 text-purple-700'
    };
    return styles[category] || styles.general;
  },

  timeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Cargar posts del Porche
  async loadPorchePosts(reset = false) {
    if (this.porcheState.loading) return;
    
    if (reset) {
      this.porcheState.page = 1;
      this.porcheState.posts = [];
      this.porcheState.hasMore = true;
    }
    
    this.porcheState.loading = true;
    
    try {
      const category = this.porcheState.filter !== 'all' ? `&category=${this.porcheState.filter}` : '';
      const response = await axios.get(`/api/porche/posts?page=${this.porcheState.page}&limit=10${category}`);
      
      if (response.data.success) {
        const { posts, pagination } = response.data.data;
        
        if (reset) {
          this.porcheState.posts = posts;
        } else {
          this.porcheState.posts = [...this.porcheState.posts, ...posts];
        }
        
        this.porcheState.hasMore = pagination.page < pagination.totalPages;
        this.renderPorcheFeed();
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      this.showToast('Error cargando publicaciones', 'error');
    } finally {
      this.porcheState.loading = false;
    }
  },

  renderPorcheFeed() {
    const feed = document.getElementById('porche-feed');
    const loadMore = document.getElementById('load-more-container');
    
    if (!feed) return;
    
    if (this.porcheState.posts.length === 0) {
      feed.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-comments text-2xl text-amber-500"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">No hay publicaciones</h3>
          <p class="text-gray-500">¡Sé el primero en compartir algo con tus vecinos!</p>
        </div>
      `;
      if (loadMore) loadMore.classList.add('hidden');
      return;
    }
    
    feed.innerHTML = this.porcheState.posts.map(post => this.renderPorchePost(post)).join('');
    
    if (loadMore) {
      if (this.porcheState.hasMore) {
        loadMore.classList.remove('hidden');
      } else {
        loadMore.classList.add('hidden');
      }
    }
  },

  filterPorchePosts(category) {
    this.porcheState.filter = category;
    this.loadPorchePosts(true);
  },

  loadMorePosts() {
    this.porcheState.page++;
    this.loadPorchePosts();
  },

  // Crear nuevo post
  async createPost() {
    const contentEl = document.getElementById('new-post-content');
    const categoryEl = document.getElementById('new-post-category');
    
    if (!contentEl) return;
    
    const content = contentEl.value.trim();
    const category = categoryEl?.value || 'general';
    
    if (!content) {
      this.showToast('Escribe algo para publicar', 'error');
      return;
    }
    
    try {
      const response = await axios.post('/api/porche/posts', {
        content,
        category,
        images: this.porcheState.newPostImages
      });
      
      if (response.data.success) {
        this.showToast('¡Publicado!', 'success');
        contentEl.value = '';
        this.porcheState.newPostImages = [];
        this.loadPorchePosts(true);
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error publicando', 'error');
    }
  },

  // Manejar selección de imagen para post
  handlePostImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.showToast('Por favor, selecciona una imagen', 'error');
      return;
    }
    
    if (this.porcheState.newPostImages.length >= 4) {
      this.showToast('Máximo 4 imágenes por post', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.porcheState.newPostImages.push(e.target.result);
      this.updatePostImagesPreview();
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  },

  removePostImage(index) {
    this.porcheState.newPostImages.splice(index, 1);
    this.updatePostImagesPreview();
  },

  updatePostImagesPreview() {
    const preview = document.getElementById('post-images-preview');
    if (!preview) return;
    
    if (this.porcheState.newPostImages.length === 0) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
    } else {
      preview.classList.remove('hidden');
      preview.innerHTML = this.porcheState.newPostImages.map((img, idx) => `
        <div class="relative">
          <img src="${img}" class="w-20 h-20 object-cover rounded-lg">
          <button onclick="App.removePostImage(${idx})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
        </div>
      `).join('');
    }
  },

  // Reaccionar a un post
  async reactToPost(postId, reactionType) {
    try {
      const response = await axios.post(`/api/porche/posts/${postId}/react`, {
        reaction_type: reactionType
      });
      
      if (response.data.success) {
        // Actualizar el post en el estado
        const postIndex = this.porcheState.posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          const post = this.porcheState.posts[postIndex];
          post.likes_count = response.data.data.likes_count;
          post.hearts_count = response.data.data.hearts_count;
          
          if (reactionType === 'like') {
            post.user_liked = response.data.data.action === 'added' ? 'like' : null;
          } else {
            post.user_hearted = response.data.data.action === 'added' ? 'heart' : null;
          }
          
          // Re-renderizar solo este post
          const postEl = document.querySelector(`[data-post-id="${postId}"]`);
          if (postEl) {
            postEl.outerHTML = this.renderPorchePost(post);
          }
        }
      }
    } catch (error) {
      this.showToast('Error al reaccionar', 'error');
    }
  },

  // Toggle comentarios
  async toggleComments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    if (!section) return;
    
    const isHidden = section.classList.contains('hidden');
    
    if (isHidden) {
      section.classList.remove('hidden');
      this.porcheState.showComments[postId] = true;
      await this.loadComments(postId);
    } else {
      section.classList.add('hidden');
      this.porcheState.showComments[postId] = false;
    }
  },

  // Cargar comentarios
  async loadComments(postId) {
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!listEl) return;
    
    try {
      const response = await axios.get(`/api/porche/posts/${postId}/comments`);
      
      if (response.data.success) {
        const comments = response.data.data;
        
        if (comments.length === 0) {
          listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No hay comentarios aún</p>';
        } else {
          listEl.innerHTML = comments.map(c => `
            <div class="flex items-start space-x-2">
              <div class="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                ${c.author_name?.charAt(0) || 'U'}
              </div>
              <div class="flex-1 bg-white rounded-xl px-3 py-2">
                <p class="text-sm font-semibold text-gray-800">${c.author_name}
                  <span class="font-normal text-gray-400 text-xs ml-1">${c.author_urbanization || ''}</span>
                </p>
                <p class="text-sm text-gray-700">${this.escapeHtml(c.content)}</p>
                <p class="text-xs text-gray-400 mt-1">${this.timeAgo(c.created_at)}</p>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      listEl.innerHTML = '<p class="text-red-500 text-sm text-center py-2">Error cargando comentarios</p>';
    }
  },

  // Añadir comentario
  async addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) return;
    
    try {
      const response = await axios.post(`/api/porche/posts/${postId}/comments`, { content });
      
      if (response.data.success) {
        input.value = '';
        await this.loadComments(postId);
        
        // Actualizar contador en el post
        const postIndex = this.porcheState.posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          this.porcheState.posts[postIndex].comments_count = (this.porcheState.posts[postIndex].comments_count || 0) + 1;
        }
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error añadiendo comentario', 'error');
    }
  },

  // Eliminar post
  async deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) return;
    
    try {
      const response = await axios.delete(`/api/porche/posts/${postId}`);
      
      if (response.data.success) {
        this.showToast('Publicación eliminada', 'success');
        this.porcheState.posts = this.porcheState.posts.filter(p => p.id !== postId);
        this.renderPorcheFeed();
      }
    } catch (error) {
      this.showToast('Error eliminando publicación', 'error');
    }
  },

  // Ver imagen en grande
  viewImage(src) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `
      <img src="${src}" class="max-w-full max-h-full rounded-lg shadow-2xl">
      <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">
        <i class="fas fa-times"></i>
      </button>
    `;
    document.body.appendChild(modal);
  },

  // =============================================
  // INMOURBA - Anuncios inmobiliarios
  // =============================================
  
  inmoUrbaState: {
    listings: [],
    currentListing: null,
    filter: 'all',
    page: 1,
    hasMore: true,
    loading: false,
    myListing: null
  },

  renderInmoUrba() {
    return `
      <div class="space-y-4 max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center space-x-3">
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
              🏠
            </div>
            <div>
              <h2 class="text-2xl font-bold">InmoUrba</h2>
              <p class="text-white/80 text-sm">Inmobiliaria de las urbanizaciones</p>
            </div>
          </div>
        </div>
        
        <!-- Filtros -->
        <div class="flex gap-2">
          <button onclick="App.filterInmoUrba('all')" 
                  class="px-4 py-2 rounded-lg font-medium transition ${this.inmoUrbaState.filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            Todos
          </button>
          <button onclick="App.filterInmoUrba('sale')" 
                  class="px-4 py-2 rounded-lg font-medium transition ${this.inmoUrbaState.filter === 'sale' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            🏷️ En venta
          </button>
          <button onclick="App.filterInmoUrba('rent')" 
                  class="px-4 py-2 rounded-lg font-medium transition ${this.inmoUrbaState.filter === 'rent' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            🔑 En alquiler
          </button>
        </div>
        
        <!-- Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          Para publicar tu vivienda, ve a la pestaña <strong>"Vivienda"</strong> en tu panel y pulsa el botón <strong>"Publicar Gratis"</strong>
        </div>
        
        <!-- Feed de anuncios -->
        <div id="inmourba-feed" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="col-span-full flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
        
        <!-- Cargar más -->
        <div id="inmourba-load-more" class="hidden">
          <button onclick="App.loadMoreInmoUrba()" 
                  class="w-full py-3 text-blue-600 hover:text-blue-700 font-medium text-sm">
            <i class="fas fa-chevron-down mr-2"></i>Cargar más anuncios
          </button>
        </div>
      </div>
    `;
  },

  renderInmoUrbaListing(listing) {
    const statusBadge = {
      active: { label: 'Activo', class: 'bg-green-100 text-green-700' },
      reserved: { label: 'Reservado', class: 'bg-yellow-100 text-yellow-700' },
      sold: { label: 'Vendido', class: 'bg-gray-100 text-gray-700' },
      rented: { label: 'Alquilado', class: 'bg-gray-100 text-gray-700' }
    }[listing.status] || { label: listing.status, class: 'bg-gray-100 text-gray-700' };

    const typeBadge = listing.listing_type === 'rent' 
      ? { label: '🔑 Alquiler', class: 'bg-purple-100 text-purple-700' }
      : { label: '🏷️ Venta', class: 'bg-blue-100 text-blue-700' };

    const priceText = listing.price 
      ? `${listing.price.toLocaleString('es-ES')}€${listing.listing_type === 'rent' ? '/mes' : ''}` 
      : 'A consultar';

    const firstImage = listing.images?.[0] || null;
    const pd = listing.property_data || {};

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
           onclick="App.viewInmoUrbaListing(${listing.id})">
        <!-- Imagen -->
        <div class="relative h-48 bg-gray-100">
          ${firstImage 
            ? `<img src="${firstImage}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="fas fa-home text-4xl"></i></div>`
          }
          <div class="absolute top-2 left-2 flex gap-1">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${typeBadge.class}">${typeBadge.label}</span>
            ${listing.status !== 'active' ? `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusBadge.class}">${statusBadge.label}</span>` : ''}
          </div>
          ${listing.verified_by_samuel ? `
            <div class="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              ✓ Verificado
            </div>
          ` : ''}
          <div class="absolute bottom-2 right-2 px-3 py-1 bg-white/90 backdrop-blur rounded-lg font-bold text-gray-900">
            ${priceText}
          </div>
        </div>
        
        <!-- Info -->
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 truncate">${listing.title || 'Vivienda en venta'}</h3>
          <p class="text-sm text-gray-500 mt-1">
            <i class="fas fa-map-marker-alt mr-1"></i>${pd.urbanization || 'Valdemorillo'}
          </p>
          <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
            ${pd.square_meters ? `<span><i class="fas fa-ruler-combined mr-1"></i>${pd.square_meters}m²</span>` : ''}
            ${pd.year_built ? `<span><i class="fas fa-calendar mr-1"></i>${pd.year_built}</span>` : ''}
            ${listing.technical_score ? `<span class="text-blue-600"><i class="fas fa-star mr-1"></i>${listing.technical_score}/100</span>` : ''}
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span class="text-sm text-gray-500">${listing.owner_name}</span>
            <span class="text-xs text-gray-400">${listing.comments_count || 0} comentarios</span>
          </div>
        </div>
      </div>
    `;
  },

  async loadInmoUrbaListings(reset = false) {
    if (this.inmoUrbaState.loading) return;
    
    if (reset) {
      this.inmoUrbaState.page = 1;
      this.inmoUrbaState.listings = [];
      this.inmoUrbaState.hasMore = true;
    }
    
    this.inmoUrbaState.loading = true;
    
    try {
      const type = this.inmoUrbaState.filter !== 'all' ? `&type=${this.inmoUrbaState.filter}` : '';
      const response = await axios.get(`/api/inmourba/listings?page=${this.inmoUrbaState.page}&limit=10${type}`);
      
      if (response.data.success) {
        const { listings, pagination } = response.data.data;
        
        if (reset) {
          this.inmoUrbaState.listings = listings;
        } else {
          this.inmoUrbaState.listings = [...this.inmoUrbaState.listings, ...listings];
        }
        
        this.inmoUrbaState.hasMore = pagination.page < pagination.totalPages;
        this.renderInmoUrbaFeed();
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      this.showToast('Error cargando anuncios', 'error');
    } finally {
      this.inmoUrbaState.loading = false;
    }
  },

  renderInmoUrbaFeed() {
    const feed = document.getElementById('inmourba-feed');
    const loadMore = document.getElementById('inmourba-load-more');
    
    if (!feed) return;
    
    if (this.inmoUrbaState.listings.length === 0) {
      feed.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-home text-2xl text-blue-500"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">No hay anuncios</h3>
          <p class="text-gray-500">Aún no hay viviendas publicadas</p>
        </div>
      `;
      if (loadMore) loadMore.classList.add('hidden');
      return;
    }
    
    feed.innerHTML = this.inmoUrbaState.listings.map(l => this.renderInmoUrbaListing(l)).join('');
    
    if (loadMore) {
      loadMore.classList.toggle('hidden', !this.inmoUrbaState.hasMore);
    }
  },

  filterInmoUrba(filter) {
    this.inmoUrbaState.filter = filter;
    this.loadInmoUrbaListings(true);
  },

  loadMoreInmoUrba() {
    this.inmoUrbaState.page++;
    this.loadInmoUrbaListings();
  },

  async viewInmoUrbaListing(id) {
    try {
      const response = await axios.get(`/api/inmourba/listings/${id}`);
      if (response.data.success) {
        this.showInmoUrbaDetailModal(response.data.data);
      }
    } catch (error) {
      this.showToast('Error cargando anuncio', 'error');
    }
  },

  showInmoUrbaDetailModal(listing) {
    const pd = listing.property_data || {};
    const priceText = listing.price 
      ? `${listing.price.toLocaleString('es-ES')}€${listing.listing_type === 'rent' ? '/mes' : ''}` 
      : 'A consultar';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.id = 'inmourba-detail-modal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Galería -->
        <div class="relative h-64 bg-gray-100">
          ${listing.images?.length > 0 
            ? `<img src="${listing.images[0]}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="fas fa-home text-6xl"></i></div>`
          }
          <button onclick="document.getElementById('inmourba-detail-modal').remove()" 
                  class="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition">
            <i class="fas fa-times"></i>
          </button>
          <div class="absolute bottom-4 left-4 px-4 py-2 bg-white/90 backdrop-blur rounded-lg">
            <span class="text-2xl font-bold text-gray-900">${priceText}</span>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">${listing.title}</h2>
            <p class="text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>${pd.address || pd.urbanization || 'Valdemorillo'}</p>
          </div>
          
          <!-- Características -->
          <div class="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">${pd.square_meters || '-'}</p>
              <p class="text-sm text-gray-500">m²</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">${pd.year_built || '-'}</p>
              <p class="text-sm text-gray-500">Año</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">${listing.technical_score || '-'}</p>
              <p class="text-sm text-gray-500">Puntuación</p>
            </div>
          </div>
          
          ${listing.description ? `<p class="text-gray-700">${listing.description}</p>` : ''}
          
          <!-- Contacto -->
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-semibold text-gray-900 mb-2">Contactar con el propietario</h4>
            <p class="text-gray-700"><i class="fas fa-user mr-2"></i>${listing.owner_name}</p>
            ${listing.owner_phone ? `
              <a href="https://wa.me/${listing.owner_phone.replace(/\D/g, '')}?text=Hola, me interesa tu vivienda en InmoUrba" 
                 target="_blank"
                 class="inline-flex items-center mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                <i class="fab fa-whatsapp mr-2"></i>WhatsApp
              </a>
            ` : ''}
          </div>
          
          <!-- Comentarios -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Comentarios (${listing.comments?.length || 0})</h4>
            <div class="space-y-3 max-h-48 overflow-y-auto" id="inmourba-comments-${listing.id}">
              ${(listing.comments || []).map(c => `
                <div class="flex items-start space-x-2 ${c.is_chari ? 'bg-blue-50 p-3 rounded-xl' : ''}">
                  <div class="w-8 h-8 ${c.is_chari ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gray-300'} rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ${c.is_chari ? '🤖' : c.author_name?.charAt(0) || 'U'}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold ${c.is_chari ? 'text-blue-700' : 'text-gray-800'}">
                      ${c.author_name}${c.is_chari ? ' <span class="font-normal text-xs">(Asistente IA)</span>' : ''}
                    </p>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">${c.content}</p>
                  </div>
                </div>
              `).join('') || '<p class="text-gray-500 text-sm">No hay comentarios aún</p>'}
            </div>
            
            <div class="flex items-center space-x-2 mt-3">
              <input type="text" id="inmourba-comment-input-${listing.id}" 
                     placeholder="Escribe un comentario..."
                     class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                     onkeypress="if(event.key==='Enter') App.addInmoUrbaComment(${listing.id})">
              <button onclick="App.addInmoUrbaComment(${listing.id})" 
                      class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  },

  async addInmoUrbaComment(listingId) {
    const input = document.getElementById(`inmourba-comment-input-${listingId}`);
    if (!input || !input.value.trim()) return;
    
    try {
      const response = await axios.post(`/api/inmourba/listings/${listingId}/comments`, {
        content: input.value.trim()
      });
      
      if (response.data.success) {
        input.value = '';
        this.viewInmoUrbaListing(listingId); // Recargar
      }
    } catch (error) {
      this.showToast('Error añadiendo comentario', 'error');
    }
  },

  // Modal para publicar en InmoUrba
  showPublishInmoUrbaModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.id = 'publish-inmourba-modal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-bullhorn mr-2 text-blue-500"></i>
          Publicar en InmoUrba
        </h3>
        
        <p class="text-gray-600 mb-4">Tu vivienda se publicará con todos los datos e imágenes que tienes guardados.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de anuncio</label>
            <div class="flex gap-2">
              <button onclick="this.classList.add('ring-2', 'ring-blue-500'); this.nextElementSibling.classList.remove('ring-2', 'ring-blue-500'); document.getElementById('listing-type').value='sale'" 
                      class="flex-1 px-4 py-3 border rounded-lg text-center hover:bg-gray-50 ring-2 ring-blue-500">
                🏷️ Venta
              </button>
              <button onclick="this.classList.add('ring-2', 'ring-blue-500'); this.previousElementSibling.classList.remove('ring-2', 'ring-blue-500'); document.getElementById('listing-type').value='rent'" 
                      class="flex-1 px-4 py-3 border rounded-lg text-center hover:bg-gray-50">
                🔑 Alquiler
              </button>
            </div>
            <input type="hidden" id="listing-type" value="sale">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Precio (opcional)</label>
            <div class="flex items-center space-x-2">
              <input type="number" id="listing-price" placeholder="Ej: 350000" 
                     class="flex-1 border border-gray-200 rounded-lg px-3 py-2">
              <span class="text-gray-500">€</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">Déjalo vacío para mostrar "A consultar"</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción adicional</label>
            <textarea id="listing-description" rows="3" 
                      placeholder="Información adicional que quieras destacar..."
                      class="w-full border border-gray-200 rounded-lg px-3 py-2"></textarea>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button onclick="document.getElementById('publish-inmourba-modal').remove()" 
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onclick="App.publishToInmoUrba()" 
                  class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            <i class="fas fa-check mr-2"></i>Publicar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  },

  async publishToInmoUrba() {
    const listingType = document.getElementById('listing-type')?.value || 'sale';
    const price = document.getElementById('listing-price')?.value;
    const description = document.getElementById('listing-description')?.value;
    
    try {
      const response = await axios.post('/api/inmourba/publish', {
        listing_type: listingType,
        price: price ? parseInt(price) : null,
        price_type: price ? 'fixed' : 'to_consult',
        description
      });
      
      if (response.data.success) {
        document.getElementById('publish-inmourba-modal')?.remove();
        this.showToast('🎉 ¡Tu vivienda ya está en InmoUrba!', 'success');
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error publicando', 'error');
    }
  },

  // =============================================
  // MERCADILLO - Compraventa entre vecinos
  // =============================================
  
  mercadilloState: {
    items: [],
    currentItem: null,
    filter: 'all',
    page: 1,
    hasMore: true,
    loading: false,
    newItemImages: []
  },

  mercadilloCategories: {
    all: { label: 'Todos', icon: '📋' },
    muebles: { label: 'Muebles', icon: '🪑' },
    electronica: { label: 'Electrónica', icon: '📱' },
    jardin: { label: 'Jardín', icon: '🌳' },
    hogar: { label: 'Hogar', icon: '🏠' },
    motor: { label: 'Motor', icon: '🚗' },
    deportes: { label: 'Deportes', icon: '⚽' },
    otros: { label: 'Otros', icon: '📦' }
  },

  mercadilloConditions: {
    new: { label: 'Nuevo', color: 'green' },
    like_new: { label: 'Como nuevo', color: 'blue' },
    good: { label: 'Buen estado', color: 'yellow' },
    fair: { label: 'Aceptable', color: 'gray' }
  },

  renderMercadillo() {
    return `
      <div class="space-y-4 max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                🏷️
              </div>
              <div>
                <h2 class="text-2xl font-bold">Mercadillo</h2>
                <p class="text-white/80 text-sm">Compra y vende entre vecinos</p>
              </div>
            </div>
            <button onclick="App.showNewMercadilloItemModal()" 
                    class="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition">
              <i class="fas fa-plus mr-2"></i>Vender algo
            </button>
          </div>
        </div>
        
        <!-- Filtros por categoría -->
        <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          ${Object.entries(this.mercadilloCategories).map(([key, cat]) => `
            <button onclick="App.filterMercadillo('${key}')" 
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition
                           ${this.mercadilloState.filter === key 
                             ? 'bg-green-500 text-white' 
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
              ${cat.icon} ${cat.label}
            </button>
          `).join('')}
        </div>
        
        <!-- Grid de artículos -->
        <div id="mercadillo-feed" class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="col-span-full flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
        
        <!-- Cargar más -->
        <div id="mercadillo-load-more" class="hidden">
          <button onclick="App.loadMoreMercadillo()" 
                  class="w-full py-3 text-green-600 hover:text-green-700 font-medium text-sm">
            <i class="fas fa-chevron-down mr-2"></i>Cargar más
          </button>
        </div>
      </div>
    `;
  },

  renderMercadilloItem(item) {
    const cat = this.mercadilloCategories[item.category] || this.mercadilloCategories.otros;
    const cond = this.mercadilloConditions[item.condition] || this.mercadilloConditions.good;
    const condColors = { green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', yellow: 'bg-yellow-100 text-yellow-700', gray: 'bg-gray-100 text-gray-700' };
    const firstImage = item.images?.[0] || null;

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
           onclick="App.viewMercadilloItem(${item.id})">
        <div class="relative aspect-square bg-gray-100">
          ${firstImage 
            ? `<img src="${firstImage}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center text-gray-400 text-3xl">${cat.icon}</div>`
          }
          ${item.status === 'reserved' ? `
            <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span class="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold">RESERVADO</span>
            </div>
          ` : ''}
          <div class="absolute top-2 left-2">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${condColors[cond.color]}">${cond.label}</span>
          </div>
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-gray-900 truncate">${item.title}</h3>
          <p class="text-lg font-bold text-green-600">${item.price}€ ${item.price_negotiable ? '<span class="text-xs font-normal text-gray-400">negociable</span>' : ''}</p>
          <p class="text-xs text-gray-500 mt-1">
            <i class="fas fa-map-marker-alt mr-1"></i>${item.seller_urbanization || item.urbanization || 'Valdemorillo'}
          </p>
        </div>
      </div>
    `;
  },

  async loadMercadilloItems(reset = false) {
    if (this.mercadilloState.loading) return;
    
    if (reset) {
      this.mercadilloState.page = 1;
      this.mercadilloState.items = [];
      this.mercadilloState.hasMore = true;
    }
    
    this.mercadilloState.loading = true;
    
    try {
      const category = this.mercadilloState.filter !== 'all' ? `&category=${this.mercadilloState.filter}` : '';
      const response = await axios.get(`/api/mercadillo/items?page=${this.mercadilloState.page}&limit=12${category}`);
      
      if (response.data.success) {
        const { items, pagination } = response.data.data;
        
        if (reset) {
          this.mercadilloState.items = items;
        } else {
          this.mercadilloState.items = [...this.mercadilloState.items, ...items];
        }
        
        this.mercadilloState.hasMore = pagination.page < pagination.totalPages;
        this.renderMercadilloFeed();
      }
    } catch (error) {
      console.error('Error loading items:', error);
      this.showToast('Error cargando artículos', 'error');
    } finally {
      this.mercadilloState.loading = false;
    }
  },

  renderMercadilloFeed() {
    const feed = document.getElementById('mercadillo-feed');
    const loadMore = document.getElementById('mercadillo-load-more');
    
    if (!feed) return;
    
    if (this.mercadilloState.items.length === 0) {
      feed.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-tag text-2xl text-green-500"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">No hay artículos</h3>
          <p class="text-gray-500">¡Sé el primero en publicar algo!</p>
        </div>
      `;
      if (loadMore) loadMore.classList.add('hidden');
      return;
    }
    
    feed.innerHTML = this.mercadilloState.items.map(item => this.renderMercadilloItem(item)).join('');
    
    if (loadMore) {
      loadMore.classList.toggle('hidden', !this.mercadilloState.hasMore);
    }
  },

  filterMercadillo(category) {
    this.mercadilloState.filter = category;
    this.loadMercadilloItems(true);
  },

  loadMoreMercadillo() {
    this.mercadilloState.page++;
    this.loadMercadilloItems();
  },

  async viewMercadilloItem(id) {
    try {
      const response = await axios.get(`/api/mercadillo/items/${id}`);
      if (response.data.success) {
        this.showMercadilloDetailModal(response.data.data);
      }
    } catch (error) {
      this.showToast('Error cargando artículo', 'error');
    }
  },

  showMercadilloDetailModal(item) {
    const cat = this.mercadilloCategories[item.category] || this.mercadilloCategories.otros;
    const cond = this.mercadilloConditions[item.condition] || this.mercadilloConditions.good;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.id = 'mercadillo-detail-modal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <!-- Imagen -->
        <div class="relative aspect-square bg-gray-100">
          ${item.images?.length > 0 
            ? `<img src="${item.images[0]}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center text-gray-400 text-6xl">${cat.icon}</div>`
          }
          <button onclick="document.getElementById('mercadillo-detail-modal').remove()" 
                  class="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition">
            <i class="fas fa-times"></i>
          </button>
          ${item.status === 'reserved' ? `
            <div class="absolute bottom-4 left-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold">
              RESERVADO
            </div>
          ` : ''}
        </div>
        
        <div class="p-6 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-900">${item.title}</h2>
              <p class="text-2xl font-bold text-green-600 mt-1">${item.price}€ ${item.price_negotiable ? '<span class="text-sm font-normal text-gray-500">negociable</span>' : ''}</p>
            </div>
            <span class="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">${cond.label}</span>
          </div>
          
          ${item.description ? `<p class="text-gray-700">${item.description}</p>` : ''}
          
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>${cat.icon} ${cat.label}</span>
            <span><i class="fas fa-map-marker-alt mr-1"></i>${item.seller_urbanization || item.urbanization || 'Valdemorillo'}</span>
          </div>
          
          <!-- Contacto vendedor -->
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-semibold text-gray-900 mb-2">Vendedor</h4>
            <p class="text-gray-700"><i class="fas fa-user mr-2"></i>${item.seller_name}</p>
            ${item.seller_phone ? `
              <a href="https://wa.me/${item.seller_phone.replace(/\D/g, '')}?text=Hola, me interesa tu artículo "${item.title}" del Mercadillo" 
                 target="_blank"
                 class="inline-flex items-center mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                <i class="fab fa-whatsapp mr-2"></i>Contactar por WhatsApp
              </a>
            ` : ''}
          </div>
          
          <!-- Comentarios -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Preguntas (${item.comments?.length || 0})</h4>
            <div class="space-y-3 max-h-48 overflow-y-auto">
              ${(item.comments || []).map(c => `
                <div class="flex items-start space-x-2">
                  <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ${c.author_name?.charAt(0) || 'U'}
                  </div>
                  <div class="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <p class="text-sm font-semibold text-gray-800">${c.author_name}</p>
                    <p class="text-sm text-gray-700">${c.content}</p>
                  </div>
                </div>
              `).join('') || '<p class="text-gray-500 text-sm">No hay preguntas aún</p>'}
            </div>
            
            <div class="flex items-center space-x-2 mt-3">
              <input type="text" id="mercadillo-comment-input-${item.id}" 
                     placeholder="Haz una pregunta..."
                     class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                     onkeypress="if(event.key==='Enter') App.addMercadilloComment(${item.id})">
              <button onclick="App.addMercadilloComment(${item.id})" 
                      class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  },

  async addMercadilloComment(itemId) {
    const input = document.getElementById(`mercadillo-comment-input-${itemId}`);
    if (!input || !input.value.trim()) return;
    
    try {
      const response = await axios.post(`/api/mercadillo/items/${itemId}/comments`, {
        content: input.value.trim()
      });
      
      if (response.data.success) {
        input.value = '';
        this.viewMercadilloItem(itemId);
      }
    } catch (error) {
      this.showToast('Error añadiendo comentario', 'error');
    }
  },

  // Modal para publicar artículo
  showNewMercadilloItemModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.id = 'new-mercadillo-modal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-tag mr-2 text-green-500"></i>
          Publicar artículo
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Título *</label>
            <input type="text" id="item-title" placeholder="¿Qué vendes?" 
                   class="w-full border border-gray-200 rounded-lg px-3 py-2" maxlength="100">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
            <div class="flex items-center space-x-2">
              <input type="number" id="item-price" placeholder="0" min="0"
                     class="flex-1 border border-gray-200 rounded-lg px-3 py-2">
              <span class="text-gray-500">€</span>
            </div>
            <label class="flex items-center mt-2">
              <input type="checkbox" id="item-negotiable" checked class="mr-2">
              <span class="text-sm text-gray-600">Precio negociable</span>
            </label>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select id="item-category" class="w-full border border-gray-200 rounded-lg px-3 py-2">
              ${Object.entries(this.mercadilloCategories).filter(([k]) => k !== 'all').map(([key, cat]) => 
                `<option value="${key}">${cat.icon} ${cat.label}</option>`
              ).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select id="item-condition" class="w-full border border-gray-200 rounded-lg px-3 py-2">
              ${Object.entries(this.mercadilloConditions).map(([key, cond]) => 
                `<option value="${key}">${cond.label}</option>`
              ).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea id="item-description" rows="3" placeholder="Describe el artículo..."
                      class="w-full border border-gray-200 rounded-lg px-3 py-2"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Fotos (máx. 6)</label>
            <input type="file" id="item-images" accept="image/*" multiple class="hidden" onchange="App.handleMercadilloImages(event)">
            <button onclick="document.getElementById('item-images').click()" 
                    class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-green-400 hover:text-green-500 transition">
              <i class="fas fa-camera text-2xl mb-2"></i>
              <p>Añadir fotos</p>
            </button>
            <div id="item-images-preview" class="flex flex-wrap gap-2 mt-2"></div>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button onclick="document.getElementById('new-mercadillo-modal').remove(); App.mercadilloState.newItemImages = [];" 
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onclick="App.createMercadilloItem()" 
                  class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            <i class="fas fa-check mr-2"></i>Publicar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  },

  handleMercadilloImages(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('item-images-preview');
    
    files.slice(0, 6 - this.mercadilloState.newItemImages.length).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.mercadilloState.newItemImages.push(e.target.result);
        this.updateMercadilloImagesPreview();
      };
      reader.readAsDataURL(file);
    });
  },

  updateMercadilloImagesPreview() {
    const preview = document.getElementById('item-images-preview');
    if (!preview) return;
    
    preview.innerHTML = this.mercadilloState.newItemImages.map((img, idx) => `
      <div class="relative">
        <img src="${img}" class="w-16 h-16 object-cover rounded-lg">
        <button onclick="App.removeMercadilloImage(${idx})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
      </div>
    `).join('');
  },

  removeMercadilloImage(idx) {
    this.mercadilloState.newItemImages.splice(idx, 1);
    this.updateMercadilloImagesPreview();
  },

  async createMercadilloItem() {
    const title = document.getElementById('item-title')?.value?.trim();
    const price = document.getElementById('item-price')?.value;
    const negotiable = document.getElementById('item-negotiable')?.checked;
    const category = document.getElementById('item-category')?.value;
    const condition = document.getElementById('item-condition')?.value;
    const description = document.getElementById('item-description')?.value?.trim();
    
    if (!title) {
      this.showToast('El título es obligatorio', 'error');
      return;
    }
    
    if (!price || price < 0) {
      this.showToast('El precio es obligatorio', 'error');
      return;
    }
    
    try {
      const response = await axios.post('/api/mercadillo/items', {
        title,
        price: parseFloat(price),
        price_negotiable: negotiable,
        category,
        condition,
        description,
        images: this.mercadilloState.newItemImages
      });
      
      if (response.data.success) {
        document.getElementById('new-mercadillo-modal')?.remove();
        this.mercadilloState.newItemImages = [];
        this.showToast('🎉 ¡Artículo publicado!', 'success');
        this.loadMercadilloItems(true);
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error publicando', 'error');
    }
  },

  // =============================================
  // ADMIN (SAMUEL) - Panel completo de administración
  // =============================================
  
  // Estado de admin
  adminState: {
    neighbors: [],
    services: [],
    reminders: [],
    managements: [],
    selectedNeighbor: null,
    searchTerm: '',
    filters: {}
  },

  renderAdmin() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="gradient-bg rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">Panel de Administración</h2>
              <p class="text-white/80 mt-1">Control total de vecinos y servicios</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="App.showNewServiceModal()" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
                <i class="fas fa-plus mr-2"></i>Nuevo Servicio
              </button>
              <button onclick="App.showNewReminderModal()" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
                <i class="fas fa-bell mr-2"></i>Nuevo Recordatorio
              </button>
            </div>
          </div>
        </div>
        
        <!-- Aviso de privacidad para admin -->
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
          <i class="fas fa-user-shield text-blue-500 mt-0.5"></i>
          <div class="text-sm text-blue-800">
            <strong>Recuerda:</strong> Solo accedes a datos técnicos de viviendas y datos de contacto que los vecinos 
            han proporcionado voluntariamente. Las conversaciones privadas con Chari <strong>no son accesibles</strong>.
          </div>
        </div>
        
        <div id="admin-content">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },

  renderAdminNeighbors() {
    return `
      <div class="space-y-6">
        <!-- Header con búsqueda -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">
                <i class="fas fa-users mr-2 text-gray-500"></i>Vecinos
              </h2>
              <p class="text-gray-500 text-sm mt-1">Gestiona todos los propietarios de la urbanización</p>
            </div>
            <div class="flex items-center space-x-3">
              <div class="relative">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="neighbor-search" placeholder="Buscar vecino..." 
                       class="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-400 w-64"
                       onkeyup="App.searchNeighbors(this.value)">
              </div>
            </div>
          </div>
        </div>
        
        <div id="neighbors-list">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },

  renderAdminServices() {
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">
                <i class="fas fa-tools mr-2 text-gray-500"></i>Servicios
              </h2>
              <p class="text-gray-500 text-sm mt-1">Mantenimientos, reparaciones y renovaciones</p>
            </div>
            <div class="flex items-center space-x-3">
              <select id="service-status-filter" onchange="App.filterServices()" 
                      class="px-4 py-2 border border-gray-200 rounded-lg">
                <option value="all">Todos los estados</option>
                <option value="pending" selected>Pendientes</option>
                <option value="scheduled">Programados</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completados</option>
              </select>
              <button onclick="App.showNewServiceModal()" class="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium">
                <i class="fas fa-plus mr-2"></i>Nuevo
              </button>
            </div>
          </div>
        </div>
        
        <div id="services-list">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },

  renderAdminReminders() {
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">
                <i class="fas fa-bell mr-2 text-gray-500"></i>Recordatorios
              </h2>
              <p class="text-gray-500 text-sm mt-1">Avisos y vencimientos programados</p>
            </div>
            <button onclick="App.showNewReminderModal()" class="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium">
              <i class="fas fa-plus mr-2"></i>Nuevo Recordatorio
            </button>
          </div>
        </div>
        
        <div id="reminders-list">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },

  renderAdminManagements() {
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">
                <i class="fas fa-building mr-2 text-gray-500"></i>Gestiones
              </h2>
              <p class="text-gray-500 text-sm mt-1">Arrendamientos y ventas en curso</p>
            </div>
            <div class="flex items-center space-x-3">
              <select id="management-type-filter" onchange="App.filterManagements()" 
                      class="px-4 py-2 border border-gray-200 rounded-lg">
                <option value="all">Todos</option>
                <option value="rental">Arrendamientos</option>
                <option value="sale">Ventas</option>
              </select>
              <button onclick="App.showNewManagementModal()" class="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium">
                <i class="fas fa-plus mr-2"></i>Nueva Gestión
              </button>
            </div>
          </div>
        </div>
        
        <div id="managements-list">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },

  renderNeighborDetail() {
    return `
      <div class="space-y-6">
        <button onclick="App.navigate('admin-neighbors')" class="text-gray-600 hover:text-gray-800 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i> Volver a vecinos
        </button>
        
        <div id="neighbor-detail">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },

  renderAdminClient() {
    return this.renderNeighborDetail();
  },

  // =============================================
  // ACCIONES API
  // =============================================
  async login(email, password) {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        this.state.token = response.data.data.token;
        this.state.user = response.data.data.user;
        localStorage.setItem('masurba_token', this.state.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.state.token}`;
        
        await this.loadDashboard();
        this.navigate(this.state.user.role === 'admin' ? 'admin' : 'dashboard');
        this.showToast('¡Bienvenido!', 'success');
        
        // Iniciar onboarding para clientes nuevos
        if (this.state.user.role !== 'admin') {
          setTimeout(() => this.startOnboarding(), 800);
        }
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error de conexión');
    }
  },
  
  logout() {
    this.state.token = null;
    this.state.user = null;
    this.state.dashboard = null;
    localStorage.removeItem('masurba_token');
    delete axios.defaults.headers.common['Authorization'];
    this.navigate('login');
  },
  
  async loadDashboard() {
    try {
      const response = await axios.get('/api/dashboard');
      if (response.data.success) {
        this.state.dashboard = response.data.data;
        this.state.property = response.data.data.property;
        this.state.maintenances = response.data.data.maintenances || [];
      }
      // Cargar también los medios del usuario
      await this.loadUserMedia();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  },
  
  async loadProperty() {
    try {
      const response = await axios.get('/api/properties');
      if (response.data.success) {
        this.state.property = response.data.data;
      }
    } catch (error) {
      console.error('Error loading property:', error);
    }
  },
  
  async saveProperty(formData) {
    try {
      const response = await axios.post('/api/properties', formData);
      if (response.data.success) {
        this.state.property = response.data.data;
        this.showToast('Vivienda guardada correctamente', 'success');
        this.render();
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error al guardar', 'error');
    }
  },
  
  async updateInstallation(type, state, isUpdated) {
    try {
      const data = {};
      if (state !== null) data.perceived_state = state;
      if (isUpdated !== undefined) {
        data.is_updated = isUpdated;
        if (isUpdated) data.year_updated = new Date().getFullYear();
      }
      
      await axios.put(`/api/properties/installations/${type}`, data);
      await this.loadProperty();
      this.showToast('Instalación actualizada', 'success');
    } catch (error) {
      this.showToast('Error al actualizar', 'error');
    }
  },
  
  async loadMaintenances() {
    try {
      const response = await axios.get('/api/maintenances');
      if (response.data.success) {
        this.state.maintenances = response.data.data;
      }
    } catch (error) {
      console.error('Error loading maintenances:', error);
    }
  },
  
  async checkMaintenance(id) {
    try {
      await axios.post(`/api/maintenances/${id}/check`, {});
      await this.loadMaintenances();
      this.showToast('Marcado como revisado', 'success');
      this.render();
    } catch (error) {
      this.showToast('Error al marcar revisión', 'error');
    }
  },
  
  async calculateEstimate(formData) {
    try {
      const response = await axios.post('/api/estimates/calculate', { ...formData, save: true });
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error al calcular', 'error');
      return null;
    }
  },
  
  async getStrategicAssessment(formData) {
    try {
      const response = await axios.post('/api/strategic/assess', formData);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error al obtener orientación', 'error');
      return null;
    }
  },
  
  async loadConversation() {
    try {
      const response = await axios.get('/api/chari/conversation');
      if (response.data.success) {
        this.state.currentConversation = response.data.data.conversation;
        
        // Actualizar el DOM directamente sin re-render completo
        const messagesDiv = document.getElementById('chat-messages');
        if (messagesDiv && this.state.currentConversation?.messages?.length > 0) {
          const messages = this.state.currentConversation.messages;
          messagesDiv.innerHTML = messages.map(m => `
            <div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
              <div class="message-bubble ${m.role === 'user' 
                ? 'gradient-bg text-white rounded-2xl rounded-br-md' 
                : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'} px-4 py-3">
                <p class="text-sm whitespace-pre-line">${this.formatMessage(m.content)}</p>
                <p class="text-xs ${m.role === 'user' ? 'text-white/70' : 'text-gray-400'} mt-1">
                  ${this.formatTime(m.timestamp)}
                </p>
              </div>
            </div>
          `).join('') + `
            <div id="typing-indicator" class="hidden flex justify-start">
              <div class="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              </div>
            </div>
          `;
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  },
  
  async sendMessage(message) {
    if (!this.state.currentConversation) return;
    
    try {
      const response = await axios.post('/api/chari/message', {
        message,
        conversation_id: this.state.currentConversation.id
      });
      
      if (response.data.success) {
        this.state.currentConversation.messages.push(response.data.data.userMessage);
        this.state.currentConversation.messages.push(response.data.data.assistantMessage);
        return response.data.data;
      }
    } catch (error) {
      this.showToast('Error al enviar mensaje', 'error');
      return null;
    }
  },
  
  // Enviar mensaje rápido desde botones
  async sendQuickMessage(message) {
    // Poner el mensaje en el input y enviarlo
    const input = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    
    if (input) {
      input.value = message;
    }
    
    // Limpiar la pantalla de bienvenida y mostrar el mensaje del usuario
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="flex justify-end">
          <div class="message-bubble gradient-bg text-white rounded-2xl rounded-br-md px-4 py-3">
            <p class="text-sm whitespace-pre-line">${message}</p>
            <p class="text-xs text-white/70 mt-1">${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div id="typing-indicator" class="flex justify-start">
          <div class="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      `;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Limpiar input
    if (input) input.value = '';
    
    // Enviar mensaje
    const result = await this.sendMessage(message);
    
    // Ocultar indicador de escritura y mostrar respuesta
    const newTypingIndicator = document.getElementById('typing-indicator');
    if (newTypingIndicator) {
      newTypingIndicator.remove();
    }
    
    if (result && chatMessages) {
      // Añadir respuesta de Chari
      const assistantBubble = document.createElement('div');
      assistantBubble.className = 'flex justify-start';
      assistantBubble.innerHTML = `
        <div class="message-bubble bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
          <p class="text-sm whitespace-pre-line">${this.formatMessage(result.assistantMessage.content)}</p>
          <p class="text-xs text-gray-400 mt-1">${this.formatTime(result.assistantMessage.timestamp)}</p>
        </div>
      `;
      chatMessages.appendChild(assistantBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },
  
  async requestContact(type) {
    try {
      const response = await axios.post('/api/contacts', { request_type: type });
      if (response.data.success) {
        const { whatsapp, user } = response.data.data;
        
        // Mostrar confirmación
        this.showToast('✅ Solicitud enviada. Abriendo WhatsApp...', 'success');
        
        // Abrir WhatsApp con el mensaje automático para Samuel
        if (whatsapp && whatsapp.phone && whatsapp.message) {
          setTimeout(() => {
            window.open(`https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.message)}`, '_blank');
          }, 500);
        }
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error al enviar solicitud', 'error');
    }
  },

  async requestProfessionalStudy() {
    try {
      const response = await axios.post('/api/contacts', { 
        request_type: 'professional_study',
        notes: 'Solicitud de estudio profesional para venta de vivienda desde sección Estrategia'
      });
      if (response.data.success) {
        const { whatsapp } = response.data.data;
        
        // Mostrar confirmación
        this.showToast('✅ Solicitud de estudio enviada. Abriendo WhatsApp...', 'success');
        
        // Abrir WhatsApp
        if (whatsapp && whatsapp.phone && whatsapp.message) {
          setTimeout(() => {
            window.open(`https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.message)}`, '_blank');
          }, 500);
        }
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error al enviar solicitud', 'error');
    }
  },
  
  // =============================================
  // POPUP DE CHARI (10 segundos después del resultado)
  // =============================================
  
  chariPopupTimers: {},
  
  scheduleChariPopup(type, context = '') {
    // Cancelar timer anterior si existe
    this.cancelChariPopup(type);
    
    // Programar nuevo popup en 10 segundos
    this.chariPopupTimers[type] = setTimeout(() => {
      const popup = document.getElementById(`chari-popup-${type}`);
      if (popup) {
        popup.classList.remove('hidden');
        popup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 10000); // 10 segundos
  },
  
  cancelChariPopup(type) {
    if (this.chariPopupTimers[type]) {
      clearTimeout(this.chariPopupTimers[type]);
      delete this.chariPopupTimers[type];
    }
    // También ocultar el popup si está visible
    const popup = document.getElementById(`chari-popup-${type}`);
    if (popup) {
      popup.classList.add('hidden');
    }
  },
  
  startChariChatFromEstimate(interventionName) {
    // Cancelar el popup
    this.cancelChariPopup('estimate');
    
    // Navegar a Chari
    this.navigate('chari');
    
    // Enviar mensaje inicial después de un pequeño delay para que cargue
    setTimeout(async () => {
      const message = `Hola Chari, acabo de calcular un presupuesto para "${interventionName}" y tengo algunas dudas. ¿Puedes ayudarme a entender mejor qué implica esta obra y qué opciones tengo?`;
      
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = message;
        // Simular envío del formulario
        const form = document.getElementById('chat-form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    }, 1000);
  },
  
  startChariChatFromStrategic() {
    // Cancelar el popup
    this.cancelChariPopup('strategic');
    
    // Navegar a Chari
    this.navigate('chari');
    
    // Enviar mensaje inicial después de un pequeño delay
    setTimeout(async () => {
      const message = `Hola Chari, estoy pensando en vender mi vivienda y he visto la orientación estratégica. Me gustaría que me ayudaras a entender qué mejoras podrían aumentar el valor de mi casa y cómo prepararla para la venta.`;
      
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = message;
        const form = document.getElementById('chat-form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    }, 1000);
  },
  
  // =============================================
  // MANEJO DE IMÁGENES EN CHAT
  // =============================================
  
  selectedImageBase64: null,
  
  handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.showToast('Por favor, selecciona una imagen', 'error');
      return;
    }
    
    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('La imagen es demasiado grande (máx. 10MB)', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]; // Quitar el prefijo data:image/...
      this.selectedImageBase64 = base64;
      
      // Mostrar preview
      const preview = document.getElementById('image-preview');
      const container = document.getElementById('image-preview-container');
      if (preview && container) {
        preview.src = e.target.result;
        container.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  },
  
  removeSelectedImage() {
    this.selectedImageBase64 = null;
    const container = document.getElementById('image-preview-container');
    const input = document.getElementById('image-input');
    if (container) container.classList.add('hidden');
    if (input) input.value = '';
  },
  
  async sendMessageWithImage(message, imageBase64) {
    if (!this.state.currentConversation) return null;
    
    try {
      // Primero analizar la imagen con OpenAI Vision
      const analysisResponse = await axios.post('/api/images/chari-analyze', {
        imageBase64,
        userMessage: message || '¿Qué puedes decirme sobre esta imagen?',
        conversationContext: {
          userName: this.state.user?.name,
          propertyType: this.state.property?.property_type,
          urbanization: this.state.property?.urbanization,
          yearBuilt: this.state.property?.year_built
        }
      });
      
      if (!analysisResponse.data.success) {
        throw new Error(analysisResponse.data.error || 'Error al analizar imagen');
      }
      
      // Guardar el mensaje del usuario con referencia a la imagen
      const userMessageText = message ? `${message} [Imagen adjunta]` : '[Imagen enviada]';
      
      // Guardar en la conversación
      const response = await axios.post('/api/chari/message', {
        message: userMessageText,
        conversation_id: this.state.currentConversation.id,
        assistant_response: analysisResponse.data.response
      });
      
      if (response.data.success) {
        this.state.currentConversation.messages.push(response.data.data.userMessage);
        this.state.currentConversation.messages.push(response.data.data.assistantMessage);
        return {
          userMessage: response.data.data.userMessage,
          assistantMessage: response.data.data.assistantMessage,
          imageAnalysis: analysisResponse.data.response
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error sending message with image:', error);
      this.showToast('Error al procesar la imagen', 'error');
      return null;
    }
  },
  
  // Generar imagen con DALL-E
  async generateImage(prompt, type = null) {
    try {
      const response = await axios.post('/api/images/generate', {
        prompt,
        type,
        size: '1024x1024',
        quality: 'standard'
      });
      
      if (response.data.success) {
        return {
          success: true,
          imageUrl: response.data.imageUrl,
          revisedPrompt: response.data.revisedPrompt
        };
      }
      
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Error generating image:', error);
      return { success: false, error: 'Error al generar la imagen' };
    }
  },

  showMaintenanceNotes(id) {
    const maintenance = this.state.maintenances.find(m => m.id === id);
    if (!maintenance) return;
    
    const categoryLabels = {
      heating: 'Calefacción',
      plumbing: 'Fontanería', 
      electrical: 'Electricidad',
      roof: 'Tejado/Cubierta',
      facade: 'Fachada',
      pool: 'Piscina',
      garden: 'Jardín',
      general: 'General'
    };
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'notes-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="App.closeNotesModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            <i class="fas fa-sticky-note text-amber-500 mr-2"></i>
            Notas de ${categoryLabels[maintenance.category] || maintenance.category}
          </h3>
          <button onclick="App.closeNotesModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form id="notes-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado actual</label>
            <select id="notes-status" class="w-full px-3 py-2 border border-gray-200 rounded-lg">
              <option value="ok" ${maintenance.status === 'ok' ? 'selected' : ''}>✅ Al día</option>
              <option value="pending" ${maintenance.status === 'pending' ? 'selected' : ''}>⚠️ Pendiente de revisión</option>
              <option value="needs_repair" ${maintenance.status === 'needs_repair' ? 'selected' : ''}>🔴 Necesita reparación</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea id="notes-text" rows="4" 
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                      placeholder="Añade observaciones sobre este elemento...">${maintenance.notes || ''}</textarea>
          </div>
          <div class="flex space-x-3 pt-2">
            <button type="button" onclick="App.closeNotesModal()" 
                    class="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" 
                    class="flex-1 gradient-bg text-white px-4 py-2 rounded-lg font-medium hover:opacity-90">
              Guardar
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listener para el formulario
    document.getElementById('notes-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('notes-status').value;
      const notes = document.getElementById('notes-text').value;
      
      try {
        await axios.put(`/api/maintenances/${id}`, { status, notes });
        await this.loadMaintenances();
        this.closeNotesModal();
        this.showToast('Notas guardadas', 'success');
        this.render();
      } catch (error) {
        this.showToast('Error al guardar notas', 'error');
      }
    });
  },
  
  closeNotesModal() {
    document.getElementById('notes-modal')?.remove();
  },
  
  // =============================================
  // TEXTOS LEGALES Y COOKIES
  // =============================================
  legalTexts: {
    privacy: {
      title: 'Política de Privacidad',
      content: `
        <h3 class="font-semibold text-lg mb-3">1. Responsable del tratamiento</h3>
        <p class="mb-4">Más Urba Multiservicios, con domicilio en Valdemorillo (Madrid).</p>
        
        <h3 class="font-semibold text-lg mb-3">2. Datos que recopilamos</h3>
        <p class="mb-2">Recopilamos únicamente:</p>
        <ul class="list-disc pl-5 mb-4 space-y-1">
          <li><strong>Datos de contacto:</strong> email y teléfono (opcional)</li>
          <li><strong>Datos técnicos de la vivienda:</strong> año construcción, m², estado de instalaciones</li>
          <li><strong>Conversaciones con Chari:</strong> para mejorar el asesoramiento</li>
        </ul>
        <p class="mb-4 bg-green-50 p-3 rounded-lg text-green-800"><strong>IMPORTANTE:</strong> No almacenamos datos bancarios, DNI, ni información personal sensible.</p>
        
        <h3 class="font-semibold text-lg mb-3">3. Finalidad</h3>
        <ul class="list-disc pl-5 mb-4 space-y-1">
          <li>Proporcionarte asesoramiento gratuito sobre tu vivienda</li>
          <li>Recordarte mantenimientos preventivos</li>
          <li>Darte orientación sobre precios de reformas</li>
        </ul>
        
        <h3 class="font-semibold text-lg mb-3">4. Quién tiene acceso</h3>
        <p class="mb-4"><strong>Solo tú</strong> tienes acceso completo a tus datos. El equipo de Más Urba solo puede ver información técnica de viviendas (nunca datos personales) para poder asesorarte mejor si lo solicitas.</p>
        
        <h3 class="font-semibold text-lg mb-3">5. Tus derechos</h3>
        <p class="mb-4">Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición escribiendo a <a href="mailto:info@masurba.es" class="text-green-600">info@masurba.es</a>.</p>
        
        <h3 class="font-semibold text-lg mb-3">6. Conservación</h3>
        <p class="mb-4">Mantendremos tus datos mientras tengas cuenta activa. Puedes solicitar su eliminación en cualquier momento.</p>
      `
    },
    terms: {
      title: 'Términos de Uso',
      content: `
        <h3 class="font-semibold text-lg mb-3">1. Servicio gratuito</h3>
        <p class="mb-4">Esta aplicación es un servicio <strong>100% gratuito</strong> ofrecido por Más Urba Multiservicios a los propietarios de chalets en las urbanizaciones de Valdemorillo.</p>
        
        <h3 class="font-semibold text-lg mb-3">2. Objetivo de la app</h3>
        <p class="mb-4">Ayudarte a mantener tu vivienda en buen estado, orientarte sobre precios de reformas y darte asesoramiento técnico. <strong>No hay ninguna obligación de contratar servicios.</strong></p>
        
        <h3 class="font-semibold text-lg mb-3">3. Precios orientativos</h3>
        <p class="mb-4">Los precios mostrados son <strong>estimaciones orientativas</strong> basadas en el mercado local. El precio final depende de una visita presencial y puede variar.</p>
        
        <h3 class="font-semibold text-lg mb-3">4. Asesoramiento de Chari</h3>
        <p class="mb-4">Chari es una asistente que proporciona orientación general. Para decisiones importantes, recomendamos siempre consultar con profesionales cualificados.</p>
        
        <h3 class="font-semibold text-lg mb-3">5. Uso responsable</h3>
        <p class="mb-4">Te comprometes a usar la app de forma responsable, proporcionar información veraz sobre tu vivienda y no usar el servicio para fines comerciales o fraudulentos.</p>
        
        <h3 class="font-semibold text-lg mb-3">6. Modificaciones</h3>
        <p class="mb-4">Podemos actualizar estos términos. Te notificaremos cualquier cambio significativo.</p>
      `
    },
    cookies: {
      title: 'Política de Cookies',
      content: `
        <h3 class="font-semibold text-lg mb-3">¿Qué cookies usamos?</h3>
        <p class="mb-4">Esta aplicación utiliza <strong>cookies técnicas mínimas</strong> necesarias para su funcionamiento:</p>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <p class="font-medium mb-2">🔐 Cookie de sesión (masurba_token)</p>
          <p class="text-sm text-gray-600">Mantiene tu sesión iniciada. Se elimina al cerrar sesión.</p>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <p class="font-medium mb-2">✅ Cookie de onboarding (masurba_onboarding_completed)</p>
          <p class="text-sm text-gray-600">Recuerda que ya viste el tour inicial. Evita mostrártelo cada vez.</p>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <p class="font-medium mb-2">🍪 Cookie de consentimiento (masurba_cookies_accepted)</p>
          <p class="text-sm text-gray-600">Recuerda que aceptaste esta política.</p>
        </div>
        
        <h3 class="font-semibold text-lg mb-3 mt-6">¿Qué NO usamos?</h3>
        <ul class="list-disc pl-5 mb-4 space-y-1">
          <li>❌ Cookies de publicidad</li>
          <li>❌ Cookies de seguimiento de terceros</li>
          <li>❌ Google Analytics ni similares</li>
          <li>❌ Píxeles de Facebook/Meta</li>
        </ul>
        
        <p class="text-sm text-gray-600">Puedes eliminar las cookies en cualquier momento desde la configuración de tu navegador.</p>
      `
    }
  },
  
  showLegalModal(type) {
    const legal = this.legalTexts[type];
    if (!legal) return;
    
    const modal = document.createElement('div');
    modal.id = 'legal-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="App.closeLegalModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden fade-in">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">${legal.title}</h2>
          <button onclick="App.closeLegalModal()" class="text-gray-400 hover:text-gray-600 text-xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh] text-gray-700 text-sm leading-relaxed">
          ${legal.content}
        </div>
        <div class="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100">
          <button onclick="App.closeLegalModal()" class="w-full gradient-bg text-white py-2 rounded-lg font-medium">
            Entendido
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },
  
  closeLegalModal() {
    document.getElementById('legal-modal')?.remove();
  },
  
  // Banner de cookies
  showCookieBanner() {
    if (localStorage.getItem('masurba_cookies_accepted')) return;
    
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg';
    banner.innerHTML = `
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">🍪</span>
          <p class="text-sm text-gray-600">
            Usamos solo <strong>cookies técnicas</strong> necesarias para el funcionamiento de la app. 
            <a href="#" onclick="App.showLegalModal('cookies'); return false;" class="text-green-600 hover:underline">Más info</a>
          </p>
        </div>
        <div class="flex space-x-3">
          <button onclick="App.acceptCookies()" class="gradient-bg text-white px-6 py-2 rounded-lg font-medium text-sm">
            Aceptar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  },
  
  acceptCookies() {
    localStorage.setItem('masurba_cookies_accepted', 'true');
    document.getElementById('cookie-banner')?.remove();
  },

  // =============================================
  // REGISTRO Y AUTENTICACIÓN
  // =============================================
  switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      tabLogin.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
      tabLogin.classList.remove('text-gray-500');
      tabRegister.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
      tabRegister.classList.add('text-gray-500');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      tabRegister.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
      tabRegister.classList.remove('text-gray-500');
      tabLogin.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
      tabLogin.classList.add('text-gray-500');
    }
  },
  
  async register(name, email, phone, password) {
    try {
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        phone: phone || null,
        password,
        role: 'client'
      });
      
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.error || 'Error al crear cuenta');
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error al crear cuenta');
    }
  },
  
  // =============================================
  // EVENT LISTENERS
  // =============================================
  attachEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btnText = document.getElementById('login-btn-text');
        const btnLoading = document.getElementById('login-btn-loading');
        const errorDiv = document.getElementById('login-error');
        
        btnText.textContent = 'Accediendo...';
        btnLoading.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        try {
          await this.login(email, password);
        } catch (error) {
          errorDiv.querySelector('span').textContent = error.message;
          errorDiv.classList.remove('hidden');
          btnText.textContent = 'Entrar';
          btnLoading.classList.add('hidden');
        }
      });
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;
        const btnText = document.getElementById('register-btn-text');
        const btnLoading = document.getElementById('register-btn-loading');
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        
        btnText.textContent = 'Creando cuenta...';
        btnLoading.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        try {
          await this.register(name, email, phone, password);
          
          // Mostrar éxito
          successDiv.querySelector('span').textContent = '¡Cuenta creada! Iniciando sesión...';
          successDiv.classList.remove('hidden');
          
          // Auto-login
          await this.login(email, password);
          
        } catch (error) {
          errorDiv.querySelector('span').textContent = error.message;
          errorDiv.classList.remove('hidden');
          btnText.textContent = 'Crear mi cuenta gratis';
          btnLoading.classList.add('hidden');
        }
      });
    }
    
    // Property form
    const propertyForm = document.getElementById('property-form');
    if (propertyForm) {
      propertyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(propertyForm));
        await this.saveProperty(formData);
      });
    }
    
    // Estimate form
    const estimateForm = document.getElementById('estimate-form');
    if (estimateForm) {
      estimateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(estimateForm));
        const result = await this.calculateEstimate(formData);
        
        if (result) {
          const resultDiv = document.getElementById('estimate-result');
          resultDiv.classList.remove('hidden');
          resultDiv.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden fade-in">
              <div class="bg-gradient-to-r from-urba-900 to-urba-700 px-6 py-4">
                <h3 class="text-lg font-semibold text-white">${result.interventionName}</h3>
                <p class="text-urba-200 text-sm">${result.description}</p>
              </div>
              <div class="p-6">
                <div class="text-center mb-6">
                  <p class="text-urba-500 text-sm mb-2">Rango orientativo</p>
                  <p class="text-4xl font-bold text-urba-900">
                    ${result.rangeFormatted.min} - ${result.rangeFormatted.max}
                  </p>
                  <p class="text-sm text-urba-500 mt-2">
                    Para ${result.squareMeters} ${result.squareMeters > 1 ? 'unidades/m²' : 'unidad/m²'} · Nivel ${result.finishLevel}
                  </p>
                </div>
                
                <div class="bg-urba-50 rounded-lg p-4 mb-4">
                  <p class="font-medium text-urba-700 mb-2">Variables que afectan al precio:</p>
                  <ul class="text-sm text-urba-600 space-y-1">
                    ${result.variables.map(v => `<li><i class="fas fa-chevron-right text-urba-400 mr-2"></i>${v}</li>`).join('')}
                  </ul>
                </div>
                
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p class="text-amber-800 text-sm">
                    <i class="fas fa-info-circle mr-2"></i>
                    <strong>Nota:</strong> ${result.notes}
                  </p>
                </div>
                
                <!-- Sección explicativa y CTA -->
                <div class="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                  <div class="flex items-start space-x-3 mb-4">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <i class="fas fa-lightbulb text-white"></i>
                    </div>
                    <div>
                      <h4 class="font-semibold text-green-800 text-lg">¿Por qué estos precios?</h4>
                      <p class="text-green-700 text-sm mt-1">Entendemos que quieras el mejor precio posible</p>
                    </div>
                  </div>
                  
                  <div class="space-y-3 mb-5">
                    <div class="flex items-start space-x-2">
                      <i class="fas fa-calculator text-green-600 mt-1"></i>
                      <p class="text-sm text-gray-700">
                        <strong>Cálculo automático e instantáneo:</strong> Este presupuesto se genera al momento usando precios medios del mercado.
                      </p>
                    </div>
                    <div class="flex items-start space-x-2">
                      <i class="fas fa-shield-alt text-green-600 mt-1"></i>
                      <p class="text-sm text-gray-700">
                        <strong>Rango medio-alto:</strong> Usamos precios conservadores para evitar sorpresas. Así te aseguras de que el presupuesto real no sea mayor.
                      </p>
                    </div>
                    <div class="flex items-start space-x-2">
                      <i class="fas fa-search-dollar text-green-600 mt-1"></i>
                      <p class="text-sm text-gray-700">
                        <strong>Samuel puede encontrar soluciones más económicas:</strong> Con una revisión presencial, es muy probable que encuentre alternativas ajustadas a tu situación real y presupuesto.
                      </p>
                    </div>
                  </div>
                  
                  <div class="bg-white/70 rounded-lg p-4 mb-4">
                    <p class="text-sm text-gray-600 italic">
                      <i class="fas fa-quote-left text-green-400 mr-2"></i>
                      En la mayoría de casos, tras la visita de Samuel, el precio final es <strong>igual o inferior</strong> al mostrado aquí, siempre que las necesidades se ajusten a soluciones estándar del mercado.
                    </p>
                  </div>
                  
                  <button onclick="App.requestContact('diagnosis_360'); App.cancelChariPopup('estimate');" 
                          class="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                    <i class="fas fa-user-check"></i>
                    <span>Solicitar revisión con Samuel</span>
                  </button>
                  <p class="text-xs text-center text-gray-500 mt-2">
                    Sin compromiso · Te contactará en menos de 24h
                  </p>
                  
                  <!-- Contenedor para popup de Chari (aparece después de 10s) -->
                  <div id="chari-popup-estimate" class="hidden mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4 animate-fade-in">
                    <div class="flex items-start space-x-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span class="text-xl">🤖</span>
                      </div>
                      <div class="flex-1">
                        <p class="font-semibold text-purple-800">¿Tienes dudas sobre esta obra?</p>
                        <p class="text-sm text-gray-600 mt-1">
                          Soy Chari, y puedo ayudarte a entender mejor qué necesitas, resolver tus dudas técnicas y orientarte antes de decidir.
                        </p>
                        <button onclick="App.startChariChatFromEstimate('${result.interventionName}')" 
                                class="mt-3 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2">
                          <i class="fas fa-comments"></i>
                          <span>Hablar con Chari</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p class="text-xs text-urba-400 mt-4">${result.disclaimer}</p>
              </div>
            </div>
          `;
          
          // Programar popup de Chari después de 10 segundos
          App.scheduleChariPopup('estimate', result.interventionName);
        }
      });
    }
    
    // Strategic form
    const strategicForm = document.getElementById('strategic-form');
    if (strategicForm) {
      // Toggle opciones de venta
      const sellRadios = strategicForm.querySelectorAll('input[name="wants_to_sell"]');
      sellRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          const sellOptions = document.getElementById('sell-options');
          sellOptions.classList.toggle('hidden', e.target.value === 'false');
        });
      });
      
      strategicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(strategicForm));
        const result = await this.getStrategicAssessment(formData);
        
        if (result) {
          const resultDiv = document.getElementById('strategic-result');
          resultDiv.classList.remove('hidden');
          
          const rec = result.recommendation;
          resultDiv.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden fade-in">
              <div class="bg-gradient-to-r from-urba-900 to-urba-700 px-6 py-4">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <i class="fas fa-lightbulb text-2xl text-accent"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-white">${rec.title}</h3>
                    <p class="text-urba-200 text-sm">${rec.description}</p>
                  </div>
                </div>
              </div>
              
              <div class="p-6 space-y-6">
                <!-- Score -->
                <div class="flex items-center justify-between p-4 bg-urba-50 rounded-lg">
                  <div>
                    <p class="text-sm text-urba-500">Tu score técnico actual</p>
                    <p class="text-2xl font-bold text-urba-900">${result.technicalScore}/100</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-sm font-medium ${
                    result.scoreLabel.color === 'green' ? 'bg-green-100 text-green-700' :
                    result.scoreLabel.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                    result.scoreLabel.color === 'yellow' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }">${result.scoreLabel.label}</span>
                </div>
                
                <!-- Razonamiento -->
                <div>
                  <h4 class="font-medium text-urba-900 mb-3">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    Razonamiento
                  </h4>
                  <ul class="space-y-2">
                    ${rec.reasoning.map(r => `
                      <li class="flex items-start">
                        <i class="fas fa-chevron-right text-urba-400 mt-1 mr-2"></i>
                        <span class="text-urba-700">${r}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                
                <!-- Consideraciones -->
                <div>
                  <h4 class="font-medium text-urba-900 mb-3">
                    <i class="fas fa-exclamation-circle text-amber-600 mr-2"></i>
                    Consideraciones
                  </h4>
                  <ul class="space-y-2">
                    ${rec.considerations.map(c => `
                      <li class="flex items-start">
                        <i class="fas fa-chevron-right text-urba-400 mt-1 mr-2"></i>
                        <span class="text-urba-700">${c}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                
                <!-- Próximos pasos -->
                <div class="bg-urba-900 text-white rounded-lg p-4">
                  <h4 class="font-medium mb-3">
                    <i class="fas fa-arrow-right mr-2"></i>
                    Próximos pasos recomendados
                  </h4>
                  <ul class="space-y-2">
                    ${rec.nextSteps.map((s, i) => `
                      <li class="flex items-center">
                        <span class="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-sm mr-3">${i + 1}</span>
                        <span>${s}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                
                ${formData.wants_to_sell === 'true' ? `
                <!-- Sección especial para vendedores -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mt-6">
                  <div class="flex items-start space-x-4">
                    <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i class="fas fa-file-contract text-2xl text-amber-600"></i>
                    </div>
                    <div>
                      <h4 class="font-bold text-amber-900 text-lg mb-2">¿Sabías que el 73% de las viviendas se venden por debajo de su potencial?</h4>
                      <p class="text-amber-800 text-sm mb-3">
                        Muchos propietarios desconocen el verdadero estado técnico de su vivienda y no pueden argumentar su precio ante compradores cada vez más informados.
                      </p>
                    </div>
                  </div>
                  
                  <div class="mt-4 space-y-3">
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-600 mt-0.5"></i>
                      <p class="text-sm text-gray-700"><strong>Un informe técnico profesional</strong> te da argumentos sólidos para defender tu precio</p>
                    </div>
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-600 mt-0.5"></i>
                      <p class="text-sm text-gray-700"><strong>Genera confianza en el comprador</strong> al mostrar transparencia sobre el estado real</p>
                    </div>
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-600 mt-0.5"></i>
                      <p class="text-sm text-gray-700"><strong>Evita sorpresas y regateos</strong> de última hora por "defectos ocultos"</p>
                    </div>
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-600 mt-0.5"></i>
                      <p class="text-sm text-gray-700"><strong>Documento oficial</strong> que puedes presentar a inmobiliarias y compradores</p>
                    </div>
                  </div>
                  
                  <div class="mt-6 p-4 bg-white rounded-lg border border-amber-200">
                    <p class="text-sm text-gray-600 mb-3">
                      <i class="fas fa-lightbulb text-amber-500 mr-2"></i>
                      <strong>Consejo de experto:</strong> Los compradores de hoy en día están muy informados. 
                      Contar con un informe técnico profesional no solo justifica tu precio, sino que acelera 
                      el proceso de venta al eliminar incertidumbres.
                    </p>
                  </div>
                  
                  <button onclick="App.requestProfessionalStudy(); App.cancelChariPopup('strategic');" 
                          class="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center shadow-lg">
                    <i class="fas fa-clipboard-check mr-3 text-lg"></i>
                    Solicitar estudio profesional
                  </button>
                  <p class="text-xs text-center text-amber-700 mt-2">Sin compromiso · Samuel te contactará en 24h</p>
                  
                  <!-- Contenedor para popup de Chari (aparece después de 10s) -->
                  <div id="chari-popup-strategic" class="hidden mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4 animate-fade-in">
                    <div class="flex items-start space-x-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span class="text-xl">🤖</span>
                      </div>
                      <div class="flex-1">
                        <p class="font-semibold text-purple-800">¿Quieres hablar sobre la venta?</p>
                        <p class="text-sm text-gray-600 mt-1">
                          Soy Chari, y puedo orientarte sobre cómo preparar tu vivienda para la venta, qué mejoras aportan más valor y resolver todas tus dudas.
                        </p>
                        <button onclick="App.startChariChatFromStrategic()" 
                                class="mt-3 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2">
                          <i class="fas fa-comments"></i>
                          <span>Hablar con Chari</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ` : ''}
                
                <p class="text-xs text-urba-400">${rec.disclaimer}</p>
              </div>
            </div>
          `;
          
          // Programar popup de Chari después de 10 segundos (solo si muestra opción de venta)
          if (result.recommendation?.showSellAdvice) {
            App.scheduleChariPopup('strategic');
          }
        }
      });
    }
    
    // Chat form - solo si estamos en la vista chari
    if (this.state.currentView === 'chari') {
      const chatForm = document.getElementById('chat-form');
      if (chatForm && !chatForm.dataset.initialized) {
        chatForm.dataset.initialized = 'true';
        
        chatForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const input = document.getElementById('chat-input');
          const message = input.value.trim();
          const hasImage = this.selectedImageBase64 !== null;
          
          if (!message && !hasImage) return;
          
          input.value = '';
          
          // Añadir mensaje del usuario inmediatamente
          const messagesDiv = document.getElementById('chat-messages');
          const imagePreviewSrc = hasImage ? document.getElementById('image-preview')?.src : null;
          
          messagesDiv.innerHTML += `
            <div class="flex justify-end fade-in">
              <div class="message-bubble gradient-bg text-white rounded-2xl rounded-br-md px-4 py-3">
                ${imagePreviewSrc ? `<img src="${imagePreviewSrc}" class="max-h-32 rounded-lg mb-2" alt="Imagen">` : ''}
                <p class="text-sm">${message || '📷 Imagen enviada'}</p>
              </div>
            </div>
          `;
          
          // Limpiar imagen seleccionada
          const imageBase64 = this.selectedImageBase64;
          this.removeSelectedImage();
          
          // Mostrar indicador de escritura
          document.getElementById('typing-indicator').classList.remove('hidden');
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
          
          // Enviar mensaje (con o sin imagen)
          let result;
          if (imageBase64) {
            result = await this.sendMessageWithImage(message, imageBase64);
          } else {
            result = await this.sendMessage(message);
          }
          
          // Ocultar indicador
          document.getElementById('typing-indicator').classList.add('hidden');
          
          if (result) {
            // Verificar si la respuesta contiene una imagen generada
            const responseContent = result.assistantMessage?.content || result.imageAnalysis || '';
            const hasGeneratedImage = result.generatedImageUrl;
            
            messagesDiv.innerHTML += `
              <div class="flex justify-start fade-in">
                <div class="message-bubble bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                  ${hasGeneratedImage ? `<img src="${result.generatedImageUrl}" class="max-w-full rounded-lg mb-2" alt="Imagen generada">` : ''}
                  <p class="text-sm whitespace-pre-line">${this.formatMessage(responseContent)}</p>
                </div>
              </div>
            `;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }
        });
        
        // Cargar conversación solo una vez
        this.loadConversation();
      }
    }
    
    // El Porche - cargar posts
    if (this.state.currentView === 'porche') {
      this.loadPorchePosts(true);
      this.showWelcomeModal('porche');
    }
    
    // InmoUrba - cargar anuncios
    if (this.state.currentView === 'inmourba') {
      this.loadInmoUrbaListings(true);
      this.showWelcomeModal('inmourba');
    }
    
    // Mercadillo - cargar artículos
    if (this.state.currentView === 'mercadillo') {
      this.loadMercadilloItems(true);
      this.showWelcomeModal('mercadillo');
    }
    
    // Admin content - cargar según vista
    if (this.state.user?.role === 'admin') {
      if (this.state.currentView === 'admin') {
        this.loadAdminDashboard();
      } else if (this.state.currentView === 'admin-neighbors') {
        this.loadNeighbors();
      } else if (this.state.currentView === 'admin-services') {
        this.loadServices();
      } else if (this.state.currentView === 'admin-reminders') {
        this.loadReminders();
      } else if (this.state.currentView === 'admin-managements') {
        this.loadManagements();
      } else if (this.state.currentView === 'neighbor-detail' || this.state.currentView === 'admin-client') {
        this.loadNeighborDetail(this.adminState.selectedNeighbor);
      }
    }
  },
  
  // =============================================
  // FUNCIONES ADMIN
  // =============================================
  
  async loadAdminDashboard() {
    try {
      const response = await axios.get('/api/admin/dashboard');
      if (response.data.success) {
        const d = response.data.data;
        const adminContent = document.getElementById('admin-content');
        
        if (adminContent) {
          adminContent.innerHTML = `
            <!-- Estadísticas principales -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm">Total Vecinos</p>
                    <p class="text-3xl font-bold text-gray-900">${d.stats?.totalNeighbors || 0}</p>
                  </div>
                  <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-users text-xl text-blue-600"></i>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm">Servicios Pendientes</p>
                    <p class="text-3xl font-bold text-amber-600">${d.stats?.pendingServices || 0}</p>
                  </div>
                  <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-tools text-xl text-amber-600"></i>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm">Recordatorios (7 días)</p>
                    <p class="text-3xl font-bold text-purple-600">${d.stats?.upcomingReminders || 0}</p>
                  </div>
                  <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-bell text-xl text-purple-600"></i>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm">Gestiones Activas</p>
                    <p class="text-3xl font-bold text-green-600">${d.stats?.activeManagements || 0}</p>
                  </div>
                  <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-building text-xl text-green-600"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Servicios urgentes -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="bg-red-50 px-6 py-4 border-b border-red-100">
                  <h3 class="font-semibold text-red-800">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Servicios Urgentes
                  </h3>
                </div>
                <div class="p-4">
                  ${(d.urgentServices || []).length > 0 ? d.urgentServices.map(s => `
                    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p class="font-medium text-gray-800">${s.title}</p>
                        <p class="text-sm text-gray-500">${s.user_name} - ${s.property_name}</p>
                      </div>
                      <span class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Urgente</span>
                    </div>
                  `).join('') : '<p class="text-gray-500 text-center py-4">No hay servicios urgentes</p>'}
                </div>
              </div>
              
              <!-- Recordatorios de hoy -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="bg-amber-50 px-6 py-4 border-b border-amber-100">
                  <h3 class="font-semibold text-amber-800">
                    <i class="fas fa-clock mr-2"></i>Recordatorios Pendientes
                  </h3>
                </div>
                <div class="p-4">
                  ${(d.todayReminders || []).length > 0 ? d.todayReminders.map(r => `
                    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p class="font-medium text-gray-800">${r.title}</p>
                        <p class="text-sm text-gray-500">${r.user_name || 'General'} - ${this.formatDate(r.due_date)}</p>
                      </div>
                      <button onclick="App.completeReminder(${r.id})" class="text-green-600 hover:text-green-800">
                        <i class="fas fa-check"></i>
                      </button>
                    </div>
                  `).join('') : '<p class="text-gray-500 text-center py-4">No hay recordatorios pendientes</p>'}
                </div>
              </div>
            </div>
            
            <!-- SOLICITUDES DE CONTACTO PENDIENTES -->
            ${(d.pendingContactRequests || []).length > 0 ? `
            <div class="bg-white rounded-xl shadow-sm border-2 border-green-400 overflow-hidden mt-6">
              <div class="bg-green-50 px-6 py-4 border-b border-green-200 flex items-center justify-between">
                <h3 class="font-semibold text-green-800">
                  <i class="fas fa-phone-volume mr-2 animate-pulse"></i>
                  Solicitudes de Contacto Pendientes 
                  <span class="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">${d.stats?.pendingContactRequests || 0}</span>
                </h3>
              </div>
              <div class="p-4 space-y-3">
                ${d.pendingContactRequests.map(cr => `
                  <div class="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <p class="font-semibold text-gray-900">${cr.user_name}</p>
                        <span class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          ${cr.request_type === 'diagnosis_360' ? '🔍 Diagnóstico 360°' : 
                            cr.request_type === 'professional_study' ? '📋 Estudio profesional' :
                            cr.request_type === 'consultation' ? '💬 Consulta' : 
                            cr.request_type === 'post_work' ? '✅ Post-obra' : '📋 Otro'}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 mt-1">
                        <i class="fas fa-phone mr-1"></i>${cr.user_phone || 'Sin teléfono'}
                        <span class="mx-2">|</span>
                        <i class="fas fa-home mr-1"></i>${cr.urbanization || 'Sin urbanización'}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-clock mr-1"></i>Solicitado: ${this.formatDate(cr.created_at)}
                      </p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button onclick="App.callContactRequest(${cr.id}, '${cr.user_phone}', '${cr.user_name}')" 
                              class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                        <i class="fab fa-whatsapp mr-1"></i>WhatsApp
                      </button>
                      <button onclick="App.markContactRequestDone(${cr.id})" 
                              class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                        <i class="fas fa-check mr-1"></i>Atendido
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <!-- Últimos vecinos -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
              <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-semibold text-gray-800">
                  <i class="fas fa-user-plus mr-2"></i>Últimos Vecinos
                </h3>
                <button onclick="App.navigate('admin-neighbors')" class="text-sm text-green-600 hover:text-green-800">
                  Ver todos <i class="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 text-left">
                    <tr>
                      <th class="px-6 py-3 text-sm font-medium text-gray-600">Vecino</th>
                      <th class="px-6 py-3 text-sm font-medium text-gray-600">Vivienda</th>
                      <th class="px-6 py-3 text-sm font-medium text-gray-600">Fecha registro</th>
                      <th class="px-6 py-3 text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    ${(d.recentNeighbors || []).map(n => `
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                          <p class="font-medium text-gray-900">${n.name}</p>
                          <p class="text-sm text-gray-500">${n.email}</p>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-700">${n.property_name || 'Sin vivienda'}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">${this.formatDate(n.created_at)}</td>
                        <td class="px-6 py-4">
                          <button onclick="App.viewNeighbor(${n.id})" class="text-green-600 hover:text-green-800">
                            <i class="fas fa-eye mr-1"></i>Ver
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      document.getElementById('admin-content').innerHTML = '<p class="text-red-600 text-center py-8">Error cargando datos</p>';
    }
  },

  // Llamar/WhatsApp a solicitud de contacto
  callContactRequest(requestId, phone, userName) {
    if (!phone) {
      this.showToast('Este usuario no tiene teléfono registrado', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola ${userName}, soy Samuel de Más Urba. He recibido tu solicitud de revisión. ¿Cuándo te viene bien que pase a verla?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  },

  // Marcar solicitud como atendida
  async markContactRequestDone(requestId) {
    try {
      const response = await axios.put(`/api/admin/contact-requests/${requestId}`, {
        status: 'completed'
      });
      
      if (response.data.success) {
        this.showToast('Solicitud marcada como atendida', 'success');
        // Recargar dashboard y notificaciones
        await this.loadPendingNotifications();
        this.loadAdminDashboard();
      }
    } catch (error) {
      this.showToast('Error actualizando solicitud', 'error');
    }
  },

  async loadNeighbors(search = '') {
    try {
      const response = await axios.get(`/api/admin/neighbors?search=${encodeURIComponent(search)}`);
      if (response.data.success) {
        this.adminState.neighbors = response.data.data;
        this.renderNeighborsList();
      }
    } catch (error) {
      console.error('Error loading neighbors:', error);
    }
  },

  searchNeighbors(term) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadNeighbors(term);
    }, 300);
  },

  renderNeighborsList() {
    const container = document.getElementById('neighbors-list');
    if (!container) return;

    const neighbors = this.adminState.neighbors;
    
    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 text-left">
              <tr>
                <th class="px-6 py-3 text-sm font-medium text-gray-600">Vecino</th>
                <th class="px-6 py-3 text-sm font-medium text-gray-600">Vivienda</th>
                <th class="px-6 py-3 text-sm font-medium text-gray-600">Estado Técnico</th>
                <th class="px-6 py-3 text-sm font-medium text-gray-600">Servicios</th>
                <th class="px-6 py-3 text-sm font-medium text-gray-600">Gestiones</th>
                <th class="px-6 py-3 text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${neighbors.length > 0 ? neighbors.map(n => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium">
                        ${n.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">${n.name}</p>
                        <p class="text-sm text-gray-500">${n.phone || n.email}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm text-gray-800">${n.property_name || 'Sin vivienda'}</p>
                    <p class="text-xs text-gray-500">${n.urbanization || ''} ${n.address ? '- ' + n.address : ''}</p>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                      <span class="text-lg font-bold ${n.technical_score >= 70 ? 'text-green-600' : n.technical_score >= 50 ? 'text-amber-600' : 'text-red-600'}">${n.technical_score || 0}</span>
                      <span class="text-gray-400">/100</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    ${n.pending_services > 0 
                      ? `<span class="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">${n.pending_services} pendiente(s)</span>`
                      : '<span class="text-gray-400 text-sm">Ninguno</span>'}
                  </td>
                  <td class="px-6 py-4">
                    ${n.active_managements > 0 
                      ? `<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">${n.active_managements} activa(s)</span>`
                      : '<span class="text-gray-400 text-sm">Ninguna</span>'}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                      <button onclick="App.viewNeighbor(${n.id})" class="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button onclick="App.callNeighbor('${n.phone}')" class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Llamar">
                        <i class="fas fa-phone"></i>
                      </button>
                      <button onclick="App.whatsappNeighbor('${n.phone}')" class="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No se encontraron vecinos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  viewNeighbor(id) {
    this.adminState.selectedNeighbor = id;
    this.navigate('neighbor-detail');
  },

  async loadNeighborDetail(id) {
    if (!id) return;
    
    try {
      const response = await axios.get(`/api/admin/neighbors/${id}`);
      if (response.data.success) {
        const d = response.data.data;
        const container = document.getElementById('neighbor-detail');
        
        if (container) {
          container.innerHTML = `
            <!-- Cabecera del vecino -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-4">
                  <div class="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white text-2xl font-bold">
                    ${d.user.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-gray-900">${d.user.name}</h2>
                    <p class="text-gray-500">${d.user.email}</p>
                    <p class="text-gray-500">${d.user.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button onclick="App.callNeighbor('${d.user.phone}')" class="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <i class="fas fa-phone mr-2"></i>Llamar
                  </button>
                  <button onclick="App.whatsappNeighbor('${d.user.phone}')" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <i class="fab fa-whatsapp mr-2"></i>WhatsApp
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Info de vivienda y score -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="font-semibold text-gray-800 mb-4">
                  <i class="fas fa-home mr-2 text-gray-500"></i>Vivienda
                </h3>
                ${d.property ? `
                  <p class="font-medium text-gray-900">${d.property.name}</p>
                  <p class="text-sm text-gray-500 mt-1">${d.property.address || 'Sin dirección'}</p>
                  <p class="text-sm text-gray-500">${d.property.urbanization || ''}</p>
                  <div class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-gray-500">Año</p>
                      <p class="font-medium">${d.property.year_built || '-'}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Superficie</p>
                      <p class="font-medium">${d.property.square_meters || '-'} m²</p>
                    </div>
                  </div>
                ` : '<p class="text-gray-500">Sin vivienda registrada</p>'}
              </div>
              
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="font-semibold text-gray-800 mb-4">
                  <i class="fas fa-chart-line mr-2 text-gray-500"></i>Estado Técnico
                </h3>
                <div class="flex items-center justify-center">
                  <div class="relative w-32 h-32">
                    <svg class="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="10"/>
                      <circle cx="50" cy="50" r="45" fill="none" 
                              stroke="${d.technicalScore >= 70 ? '#22c55e' : d.technicalScore >= 50 ? '#f59e0b' : '#ef4444'}" 
                              stroke-width="10"
                              stroke-dasharray="${d.technicalScore * 2.83} 283" 
                              stroke-linecap="round"
                              transform="rotate(-90 50 50)"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-3xl font-bold text-gray-900">${d.technicalScore}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 class="font-semibold text-gray-800 mb-4">
                  <i class="fas fa-tags mr-2 text-gray-500"></i>Etiquetas
                </h3>
                <div class="flex flex-wrap gap-2">
                  ${(d.tags || []).map(t => `
                    <span class="px-3 py-1 text-sm rounded-full ${this.getTagColor(t.tag_name)}">${this.getTagLabel(t.tag_name)}</span>
                  `).join('') || '<p class="text-gray-500 text-sm">Sin etiquetas</p>'}
                </div>
                <button onclick="App.showAddTagModal(${d.user.id})" class="mt-4 text-sm text-green-600 hover:text-green-800">
                  <i class="fas fa-plus mr-1"></i>Añadir etiqueta
                </button>
              </div>
            </div>
            
            <!-- Servicios y Gestiones -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 class="font-semibold text-gray-800">
                    <i class="fas fa-tools mr-2"></i>Servicios
                  </h3>
                  <button onclick="App.showNewServiceModal(${d.user.id}, ${d.property?.id})" class="text-sm text-green-600 hover:text-green-800">
                    <i class="fas fa-plus mr-1"></i>Nuevo
                  </button>
                </div>
                <div class="p-4 max-h-64 overflow-y-auto">
                  ${(d.services || []).length > 0 ? d.services.map(s => `
                    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p class="font-medium text-gray-800">${s.title}</p>
                        <p class="text-xs text-gray-500">${s.service_type} - ${this.formatDate(s.scheduled_date)}</p>
                      </div>
                      <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(s.status)}">${this.getStatusLabel(s.status)}</span>
                    </div>
                  `).join('') : '<p class="text-gray-500 text-center py-4">Sin servicios registrados</p>'}
                </div>
              </div>
              
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 class="font-semibold text-gray-800">
                    <i class="fas fa-building mr-2"></i>Gestiones
                  </h3>
                  <button onclick="App.showNewManagementModal(${d.property?.id})" class="text-sm text-green-600 hover:text-green-800">
                    <i class="fas fa-plus mr-1"></i>Nueva
                  </button>
                </div>
                <div class="p-4 max-h-64 overflow-y-auto">
                  ${(d.managements || []).length > 0 ? d.managements.map(m => `
                    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p class="font-medium text-gray-800">${m.management_type === 'rental' ? 'Arrendamiento' : 'Venta'}</p>
                        <p class="text-xs text-gray-500">${m.price ? m.price.toLocaleString() + '€' : 'Sin precio'}</p>
                      </div>
                      <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(m.status)}">${this.getStatusLabel(m.status)}</span>
                    </div>
                  `).join('') : '<p class="text-gray-500 text-center py-4">Sin gestiones registradas</p>'}
                </div>
              </div>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading neighbor detail:', error);
    }
  },

  async loadServices() {
    try {
      const status = document.getElementById('service-status-filter')?.value || 'pending';
      const response = await axios.get(`/api/admin/services?status=${status}`);
      if (response.data.success) {
        this.adminState.services = response.data.data;
        this.renderServicesList();
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  },

  filterServices() {
    this.loadServices();
  },

  renderServicesList() {
    const container = document.getElementById('services-list');
    if (!container) return;
    
    const services = this.adminState.services;
    
    container.innerHTML = `
      <div class="space-y-4">
        ${services.length > 0 ? services.map(s => `
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <span class="px-2 py-1 text-xs rounded-full ${s.priority === 'urgent' ? 'bg-red-100 text-red-700' : s.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}">
                    ${s.priority === 'urgent' ? 'Urgente' : s.priority === 'high' ? 'Alta' : 'Normal'}
                  </span>
                  <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(s.status)}">${this.getStatusLabel(s.status)}</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mt-2">${s.title}</h3>
                <p class="text-gray-500 text-sm mt-1">${s.description || 'Sin descripción'}</p>
                <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <span><i class="fas fa-user mr-1"></i>${s.user_name}</span>
                  <span><i class="fas fa-home mr-1"></i>${s.property_name}</span>
                  ${s.scheduled_date ? `<span><i class="fas fa-calendar mr-1"></i>${this.formatDate(s.scheduled_date)}</span>` : ''}
                </div>
              </div>
              <div class="flex flex-col space-y-2 ml-4">
                <button onclick="App.updateServiceStatus(${s.id}, 'in_progress')" class="px-3 py-1 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">
                  En progreso
                </button>
                <button onclick="App.updateServiceStatus(${s.id}, 'completed')" class="px-3 py-1 text-sm border border-green-200 text-green-600 rounded-lg hover:bg-green-50">
                  Completar
                </button>
              </div>
            </div>
          </div>
        `).join('') : '<p class="text-gray-500 text-center py-8">No hay servicios con este filtro</p>'}
      </div>
    `;
  },

  async loadReminders() {
    try {
      const response = await axios.get('/api/admin/reminders?status=pending');
      if (response.data.success) {
        this.adminState.reminders = response.data.data;
        this.renderRemindersList();
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  },

  renderRemindersList() {
    const container = document.getElementById('reminders-list');
    if (!container) return;
    
    const reminders = this.adminState.reminders;
    
    container.innerHTML = `
      <div class="space-y-4">
        ${reminders.length > 0 ? reminders.map(r => `
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-gray-900">${r.title}</h3>
                <p class="text-sm text-gray-500 mt-1">${r.description || ''}</p>
                <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <span><i class="fas fa-calendar mr-1"></i>${this.formatDate(r.due_date)}</span>
                  ${r.user_name ? `<span><i class="fas fa-user mr-1"></i>${r.user_name}</span>` : ''}
                  ${r.property_name ? `<span><i class="fas fa-home mr-1"></i>${r.property_name}</span>` : ''}
                </div>
              </div>
              <button onclick="App.completeReminder(${r.id})" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-check mr-2"></i>Completar
              </button>
            </div>
          </div>
        `).join('') : '<p class="text-gray-500 text-center py-8">No hay recordatorios pendientes</p>'}
      </div>
    `;
  },

  async loadManagements() {
    try {
      const type = document.getElementById('management-type-filter')?.value || 'all';
      const response = await axios.get(`/api/admin/managements?type=${type}`);
      if (response.data.success) {
        this.adminState.managements = response.data.data;
        this.renderManagementsList();
      }
    } catch (error) {
      console.error('Error loading managements:', error);
    }
  },

  filterManagements() {
    this.loadManagements();
  },

  renderManagementsList() {
    const container = document.getElementById('managements-list');
    if (!container) return;
    
    const managements = this.adminState.managements;
    
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${managements.length > 0 ? managements.map(m => `
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-start justify-between mb-4">
              <span class="px-3 py-1 text-sm rounded-full ${m.management_type === 'rental' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">
                ${m.management_type === 'rental' ? 'Arrendamiento' : 'Venta'}
              </span>
              <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(m.status)}">${this.getStatusLabel(m.status)}</span>
            </div>
            <h3 class="font-semibold text-gray-900">${m.property_name}</h3>
            <p class="text-sm text-gray-500">${m.address || ''}</p>
            <p class="text-sm text-gray-500 mt-1">Propietario: ${m.owner_name}</p>
            ${m.price ? `<p class="text-2xl font-bold text-gray-900 mt-3">${m.price.toLocaleString()}€</p>` : ''}
            ${m.tenant_name ? `<p class="text-sm text-gray-500 mt-2"><i class="fas fa-user mr-1"></i>Inquilino: ${m.tenant_name}</p>` : ''}
          </div>
        `).join('') : '<p class="text-gray-500 text-center py-8 col-span-2">No hay gestiones activas</p>'}
      </div>
    `;
  },

  // Funciones auxiliares para admin
  async updateServiceStatus(id, status) {
    try {
      await axios.put(`/api/admin/services/${id}`, { status });
      this.showToast('Servicio actualizado', 'success');
      this.loadServices();
    } catch (error) {
      this.showToast('Error actualizando servicio', 'error');
    }
  },

  async completeReminder(id) {
    try {
      await axios.put(`/api/admin/reminders/${id}`, { status: 'completed' });
      this.showToast('Recordatorio completado', 'success');
      if (this.state.currentView === 'admin') {
        this.loadAdminDashboard();
      } else {
        this.loadReminders();
      }
    } catch (error) {
      this.showToast('Error completando recordatorio', 'error');
    }
  },

  callNeighbor(phone) {
    if (phone) window.open(`tel:${phone}`, '_self');
  },

  whatsappNeighbor(phone) {
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  },

  getTagColor(tag) {
    const colors = {
      'partial_reform': 'bg-amber-100 text-amber-700',
      'integral_reform': 'bg-red-100 text-red-700',
      'potential_sale': 'bg-purple-100 text-purple-700',
      'premium_client': 'bg-yellow-100 text-yellow-700',
      'educable_client': 'bg-blue-100 text-blue-700',
      'urgent': 'bg-red-100 text-red-700',
      'vip': 'bg-green-100 text-green-700'
    };
    return colors[tag] || 'bg-gray-100 text-gray-700';
  },

  getTagLabel(tag) {
    const labels = {
      'partial_reform': 'Reforma parcial',
      'integral_reform': 'Reforma integral',
      'potential_sale': 'Posible venta',
      'premium_client': 'Premium',
      'educable_client': 'Educable',
      'urgent': 'Urgente',
      'vip': 'VIP'
    };
    return labels[tag] || tag;
  },

  getStatusColor(status) {
    const colors = {
      'pending': 'bg-amber-100 text-amber-700',
      'scheduled': 'bg-blue-100 text-blue-700',
      'in_progress': 'bg-purple-100 text-purple-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-gray-100 text-gray-700',
      'active': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  },

  getStatusLabel(status) {
    const labels = {
      'pending': 'Pendiente',
      'scheduled': 'Programado',
      'in_progress': 'En progreso',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'active': 'Activo'
    };
    return labels[status] || status;
  },

  // Modales (placeholder - se pueden expandir)
  showNewServiceModal(userId, propertyId) {
    this.showToast('Función de crear servicio - próximamente', 'info');
  },

  showNewReminderModal() {
    this.showToast('Función de crear recordatorio - próximamente', 'info');
  },

  showNewManagementModal(propertyId) {
    this.showToast('Función de crear gestión - próximamente', 'info');
  },

  showAddTagModal(userId) {
    this.showToast('Función de añadir etiqueta - próximamente', 'info');
  }
};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => App.init());
