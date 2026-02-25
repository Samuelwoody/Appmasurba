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
  // SISTEMA DE ONBOARDING
  // =============================================
  onboardingSteps: [
    {
      id: 'welcome',
      title: '¡Bienvenido a tu panel de control! 🏠',
      description: 'Esta app te ayuda a tener tu chalet de Valdemorillo siempre bajo control. Te voy a enseñar cómo funciona en unos segundos.',
      target: null,
      position: 'center'
    },
    {
      id: 'score',
      title: 'Tu puntuación técnica',
      description: 'Este número indica el estado general de tu vivienda. Cuanto más alto, mejor. Se calcula según los datos que registres.',
      target: '[data-tour="score"]',
      position: 'bottom'
    },
    {
      id: 'maintenance',
      title: 'Control de mantenimientos',
      description: 'Aquí ves cuántos mantenimientos tienes pendientes de revisar: caldera, tejado, piscina... ¡Nunca más se te olvidará nada!',
      target: '[data-tour="maintenance"]',
      position: 'bottom'
    },
    {
      id: 'chari',
      title: 'Chari, tu asesora personal',
      description: 'Chari es experta en viviendas y conoce Valdemorillo de toda la vida. Pregúntale lo que quieras: precios, reformas, trámites, consejos...',
      target: '[data-tour="chari"]',
      position: 'bottom'
    },
    {
      id: 'property',
      title: 'Configura tu vivienda',
      description: 'En "Mi Vivienda" puedes registrar los datos de tu chalet. Cuanta más información pongas, mejores consejos podrá darte Chari.',
      target: '[data-tour="property"]',
      position: 'top'
    },
    {
      id: 'nav',
      title: 'Navega por las secciones',
      description: 'Desde el menú puedes acceder a: tu vivienda, mantenimientos, calculadora de presupuestos, estrategia de valor y hablar con Chari.',
      target: '[data-tour="nav"]',
      position: 'right'
    },
    {
      id: 'finish',
      title: '¡Ya estás listo! 🎉',
      description: 'Te recomiendo empezar hablando con Chari. Cuéntale sobre tu chalet y ella te guiará para sacarle el máximo partido a la app.',
      target: null,
      position: 'center',
      action: 'go-to-chari'
    }
  ],
  
  startOnboarding() {
    const completed = localStorage.getItem('masurba_onboarding_completed');
    if (completed) {
      this.state.onboardingCompleted = true;
      return;
    }
    this.state.onboardingStep = 0;
    this.showOnboardingStep();
  },
  
  showOnboardingStep() {
    const step = this.onboardingSteps[this.state.onboardingStep];
    if (!step) {
      this.finishOnboarding();
      return;
    }
    
    // Eliminar overlay anterior si existe
    document.getElementById('onboarding-overlay')?.remove();
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'fixed inset-0 z-50 transition-opacity duration-300';
    
    // Encontrar elemento objetivo
    let targetRect = null;
    let targetElement = null;
    if (step.target) {
      targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetRect = targetElement.getBoundingClientRect();
        targetElement.classList.add('onboarding-highlight');
      }
    }
    
    // Calcular posición del tooltip
    let tooltipStyle = '';
    let arrowClass = '';
    
    if (step.position === 'center' || !targetRect) {
      tooltipStyle = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
    } else if (step.position === 'bottom') {
      tooltipStyle = `top: ${targetRect.bottom + 15}px; left: ${targetRect.left + targetRect.width/2}px; transform: translateX(-50%);`;
      arrowClass = 'arrow-top';
    } else if (step.position === 'top') {
      tooltipStyle = `top: ${targetRect.top - 15}px; left: ${targetRect.left + targetRect.width/2}px; transform: translate(-50%, -100%);`;
      arrowClass = 'arrow-bottom';
    } else if (step.position === 'right') {
      tooltipStyle = `top: ${targetRect.top + targetRect.height/2}px; left: ${targetRect.right + 15}px; transform: translateY(-50%);`;
      arrowClass = 'arrow-left';
    }
    
    const isLastStep = this.state.onboardingStep === this.onboardingSteps.length - 1;
    const isFirstStep = this.state.onboardingStep === 0;
    
    overlay.innerHTML = `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      ${targetRect ? `
        <div class="absolute bg-transparent rounded-xl shadow-[0_0_0_4000px_rgba(0,0,0,0.6)]" 
             style="top: ${targetRect.top - 8}px; left: ${targetRect.left - 8}px; width: ${targetRect.width + 16}px; height: ${targetRect.height + 16}px;">
        </div>
      ` : ''}
      <div class="absolute bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 ${arrowClass}" style="${tooltipStyle}">
        <div class="flex items-start justify-between mb-3">
          <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            ${this.state.onboardingStep + 1} / ${this.onboardingSteps.length}
          </span>
          <button onclick="App.skipOnboarding()" class="text-gray-400 hover:text-gray-600 text-sm">
            Saltar tour
          </button>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">${step.title}</h3>
        <p class="text-gray-600 text-sm mb-5">${step.description}</p>
        <div class="flex items-center justify-between">
          ${!isFirstStep ? `
            <button onclick="App.prevOnboardingStep()" class="text-gray-500 hover:text-gray-700 text-sm font-medium">
              <i class="fas fa-arrow-left mr-1"></i> Anterior
            </button>
          ` : '<div></div>'}
          <button onclick="App.nextOnboardingStep()" 
                  class="gradient-bg text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition">
            ${isLastStep ? '<i class="fas fa-comments mr-2"></i>Hablar con Chari' : 'Siguiente <i class="fas fa-arrow-right ml-1"></i>'}
          </button>
        </div>
      </div>
    `;
    
    // Añadir estilos del onboarding
    if (!document.getElementById('onboarding-styles')) {
      const styles = document.createElement('style');
      styles.id = 'onboarding-styles';
      styles.textContent = `
        .onboarding-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(91, 184, 138, 0.5);
          border-radius: 12px;
        }
        .arrow-top::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid white;
        }
        .arrow-bottom::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }
        .arrow-left::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid white;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(overlay);
  },
  
  nextOnboardingStep() {
    // Quitar highlight del elemento anterior
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    const currentStep = this.onboardingSteps[this.state.onboardingStep];
    
    // Si es el último paso, ir a Chari
    if (this.state.onboardingStep === this.onboardingSteps.length - 1) {
      this.finishOnboarding();
      this.navigate('chari');
      return;
    }
    
    this.state.onboardingStep++;
    this.showOnboardingStep();
  },
  
  prevOnboardingStep() {
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    if (this.state.onboardingStep > 0) {
      this.state.onboardingStep--;
      this.showOnboardingStep();
    }
  },
  
  skipOnboarding() {
    this.finishOnboarding();
  },
  
  finishOnboarding() {
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    document.getElementById('onboarding-overlay')?.remove();
    localStorage.setItem('masurba_onboarding_completed', 'true');
    this.state.onboardingCompleted = true;
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
  },
  
  // Estado para WhatsApp
  whatsappVisible: false,

  // Mostrar/ocultar WhatsApp
  toggleWhatsApp() {
    this.whatsappVisible = !this.whatsappVisible;
    this.render();
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
          <div class="max-w-7xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <img src="/static/logo.png" alt="Más Urba" class="w-12 h-12">
                <div>
                  <h1 class="text-lg font-semibold leading-tight text-gray-800">Urbanizaciones de Valdemorillo</h1>
                  <p class="text-gray-500 text-xs">Control y Estrategia de Chalets</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <!-- Botón Administración (sutil) -->
                <button onclick="App.toggleWhatsApp()" 
                        class="text-gray-400 hover:text-gray-600 transition text-sm flex items-center"
                        title="Contactar con administración">
                  <i class="fas fa-headset mr-1"></i>
                  <span class="hidden sm:inline text-xs">Administración</span>
                </button>
                <span class="text-sm text-gray-600 hidden sm:block">
                  <i class="fas fa-user mr-1 text-gray-400"></i> ${this.state.user?.name || ''}
                </span>
                <button onclick="App.logout()" class="text-gray-400 hover:text-gray-600 transition" title="Cerrar sesión">
                  <i class="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Navegación -->
        <nav class="bg-gray-50 border-b border-gray-200 sticky top-0 z-40" data-tour="nav">
          <div class="max-w-7xl mx-auto px-4">
            <div class="flex space-x-1 overflow-x-auto py-2">
              ${isAdmin ? this.renderAdminNav() : this.renderClientNav()}
            </div>
          </div>
        </nav>
        
        <!-- Contenido principal -->
        <main class="max-w-7xl mx-auto px-4 py-6 fade-in">
          ${content}
        </main>
        
        <!-- Footer -->
        <footer class="bg-gray-50 border-t border-gray-200 text-gray-500 py-6 mt-12">
          <div class="max-w-7xl mx-auto px-4 text-center text-sm">
            <img src="/static/logo.png" alt="Más Urba Multiservicios" class="w-10 h-10 mx-auto mb-2 opacity-80">
            <p class="text-gray-600">© ${new Date().getFullYear()} Más Urba Multiservicios</p>
            <p class="text-gray-400 mt-1">Urbanizaciones de Valdemorillo, Madrid</p>
          </div>
        </footer>
        
        <!-- WhatsApp Popup -->
        ${this.whatsappVisible ? `
        <div class="fixed bottom-6 right-6 z-50 whatsapp-popup">
          <div class="bg-white rounded-2xl shadow-xl p-4 mb-3 border border-gray-100 max-w-xs">
            <div class="flex items-start space-x-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-green-400 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-gray-800 text-sm">Samuel García</p>
                <p class="text-gray-500 text-xs mt-0.5">Más Urba Multiservicios</p>
                <p class="text-gray-600 text-sm mt-2">¿En qué puedo ayudarte?</p>
              </div>
            </div>
            <button onclick="App.openWhatsApp()" 
                    class="whatsapp-btn w-full mt-3 text-white py-2.5 rounded-xl font-medium flex items-center justify-center">
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
    const items = [
      { id: 'dashboard', icon: 'tachometer-alt', label: 'Panel' },
      { id: 'property', icon: 'home', label: 'Mi Vivienda' },
      { id: 'maintenance', icon: 'tools', label: 'Mantenimiento' },
      { id: 'estimates', icon: 'calculator', label: 'Estimaciones' },
      { id: 'strategic', icon: 'chess', label: 'Estrategia' },
      { id: 'chari', icon: 'comments', label: 'Chari' }
    ];
    
    return items.map(item => `
      <button onclick="App.navigate('${item.id}')" 
              class="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
                     ${this.state.currentView === item.id 
                       ? 'gradient-bg text-white' 
                       : 'text-gray-600 hover:bg-gray-100'}">
        <i class="fas fa-${item.icon} mr-2"></i>
        <span class="hidden sm:inline">${item.label}</span>
      </button>
    `).join('');
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
            <img src="/static/logo.png" alt="Más Urba Multiservicios" class="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg">
            <h1 class="text-3xl md:text-4xl font-bold leading-tight">
              Tu chalet en Valdemorillo<br>bajo control total
            </h1>
            <p class="mt-4 text-lg text-white/90">
              La app <span class="font-semibold">100% GRATUITA</span> exclusiva para propietarios de chalets en las urbanizaciones de Valdemorillo
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
              Por <span class="font-medium">Más Urba Multiservicios</span> · Solo para vecinos de las urbanizaciones de Valdemorillo
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
                  ${['Los Robles', 'Las Colinas', 'El Bosque', 'La Dehesa', 'Los Arroyos', 'Monte Alto', 'Prado del Rey', 'Valdemorillo Centro', 'Otra'].map(u => 
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
  // MANTENIMIENTO
  // =============================================
  renderMaintenance() {
    const maintenances = this.state.maintenances || [];
    
    const categories = [
      { category: 'roof', label: 'Cubierta/Tejado', icon: 'home', frequency: 'Cada 2-3 años' },
      { category: 'electricity', label: 'Electricidad', icon: 'bolt', frequency: 'Cada 10 años' },
      { category: 'plumbing', label: 'Fontanería', icon: 'faucet', frequency: 'Cada 5 años' },
      { category: 'boiler', label: 'Caldera', icon: 'fire', frequency: 'Anual (obligatorio)' },
      { category: 'facade', label: 'Fachada', icon: 'building', frequency: 'Cada 5-10 años' },
      { category: 'insulation', label: 'Aislamiento', icon: 'thermometer-half', frequency: 'Según necesidad' },
      { category: 'pool', label: 'Piscina', icon: 'swimming-pool', frequency: 'Anual (pre-temporada)' },
      { category: 'garden', label: 'Jardín', icon: 'leaf', frequency: 'Trimestral' }
    ];
    
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
            <h2 class="text-xl font-semibold text-urba-900">
              <i class="fas fa-clipboard-check mr-2 text-urba-500"></i>
              Control de mantenimiento
            </h2>
            <p class="text-sm text-urba-500 mt-1">Gestiona las revisiones de tu vivienda</p>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${categories.map(cat => {
                const m = maintenances.find(x => x.category === cat.category) || {};
                const statusColors = {
                  checked: 'bg-green-100 text-green-700 border-green-200',
                  pending: 'bg-amber-100 text-amber-700 border-amber-200',
                  needs_repair: 'bg-red-100 text-red-700 border-red-200',
                  repaired: 'bg-blue-100 text-blue-700 border-blue-200'
                };
                const statusLabels = {
                  checked: 'Revisado',
                  pending: 'Pendiente',
                  needs_repair: 'Necesita reparación',
                  repaired: 'Reparado'
                };
                
                return `
                  <div class="border border-urba-200 rounded-xl p-4 hover:shadow-md transition">
                    <div class="flex items-start justify-between">
                      <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-urba-100 rounded-xl flex items-center justify-center">
                          <i class="fas fa-${cat.icon} text-xl text-urba-600"></i>
                        </div>
                        <div>
                          <p class="font-semibold text-urba-900">${cat.label}</p>
                          <p class="text-xs text-urba-500">${cat.frequency}</p>
                        </div>
                      </div>
                      <span class="px-2 py-1 text-xs rounded-full border ${statusColors[m.status] || statusColors.pending}">
                        ${statusLabels[m.status] || 'Pendiente'}
                      </span>
                    </div>
                    
                    <div class="mt-4 space-y-2 text-sm">
                      ${m.last_checked ? `
                        <p class="text-urba-600">
                          <i class="fas fa-check mr-1"></i>
                          Última revisión: ${this.formatDate(m.last_checked)}
                        </p>
                      ` : ''}
                      ${m.next_recommended ? `
                        <p class="text-urba-500">
                          <i class="fas fa-calendar mr-1"></i>
                          Próxima: ${this.formatDate(m.next_recommended)}
                        </p>
                      ` : ''}
                    </div>
                    
                    <div class="mt-4 flex space-x-2">
                      ${m.status !== 'checked' ? `
                        <button onclick="App.checkMaintenance(${m.id})" 
                                class="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                          <i class="fas fa-check mr-1"></i> Marcar revisado
                        </button>
                      ` : ''}
                      <button onclick="App.showMaintenanceNotes(${m.id})" 
                              class="px-3 py-2 border border-urba-200 rounded-lg text-sm text-urba-600 hover:bg-urba-50 transition">
                        <i class="fas fa-sticky-note"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
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
              Valoración estratégica
            </h2>
            <p class="text-sm text-urba-500 mt-1">Orientación para decisiones sobre tu vivienda</p>
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
                <div class="mt-6 space-y-3 max-w-sm mx-auto">
                  <p class="text-gray-500 text-sm font-medium">¿Por dónde empezamos?</p>
                  <div class="grid grid-cols-2 gap-2">
                    <button onclick="App.sendQuickMessage('Quiero que me ayudes a rellenar los datos de mi vivienda')" 
                            class="text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-sm">
                      <i class="fas fa-home text-green-500 mr-2"></i>
                      Configurar mi vivienda
                    </button>
                    <button onclick="App.sendQuickMessage('¿Cómo funciona la app y qué puedo hacer?')" 
                            class="text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-sm">
                      <i class="fas fa-question-circle text-blue-500 mr-2"></i>
                      Cómo funciona
                    </button>
                    <button onclick="App.sendQuickMessage('Tengo una duda sobre una reforma en mi casa')" 
                            class="text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-sm">
                      <i class="fas fa-tools text-amber-500 mr-2"></i>
                      Preguntar reforma
                    </button>
                    <button onclick="App.sendQuickMessage('¿Cuánto vale mi casa y qué puedo hacer para aumentar su valor?')" 
                            class="text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition text-sm">
                      <i class="fas fa-chart-line text-purple-500 mr-2"></i>
                      Valorar mi chalet
                    </button>
                  </div>
                  <p class="text-gray-400 text-xs mt-4">
                    O escríbeme directamente lo que necesites 👇
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
            <button onclick="App.openWhatsApp('Hola Samuel, vengo de hablar con Chari y me gustaría una valoración personalizada.')" 
                    class="w-full whatsapp-btn text-white py-3 rounded-xl font-medium flex items-center justify-center">
              <i class="fab fa-whatsapp mr-2 text-lg"></i>
              Contactar con Samuel por WhatsApp
            </button>
          </div>
          ` : ''}
          
          <!-- Input -->
          <form id="chat-form" class="p-4 bg-white border-t border-gray-100">
            <div class="flex space-x-3">
              <input type="text" id="chat-input" 
                     class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent"
                     placeholder="Escribe tu mensaje..."
                     autocomplete="off">
              <button type="submit" 
                      class="gradient-bg text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2 text-center">
              Chari recuerda tus conversaciones anteriores para darte mejor orientación
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
        this.showToast(response.data.message, 'success');
      }
    } catch (error) {
      this.showToast(error.response?.data?.error || 'Error al enviar solicitud', 'error');
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
        <p class="mb-4">Los precios mostrados son <strong>estimaciones orientativas</strong> basadas en el mercado local. El precio final depende de una valoración presencial y puede variar.</p>
        
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
                
                <p class="text-xs text-urba-400 mt-4">${result.disclaimer}</p>
              </div>
            </div>
          `;
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
                
                <p class="text-xs text-urba-400">${rec.disclaimer}</p>
              </div>
            </div>
          `;
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
          
          if (!message) return;
          
          input.value = '';
          
          // Añadir mensaje del usuario inmediatamente
          const messagesDiv = document.getElementById('chat-messages');
          messagesDiv.innerHTML += `
            <div class="flex justify-end fade-in">
              <div class="message-bubble bg-urba-900 text-white rounded-2xl rounded-br-md px-4 py-3">
                <p class="text-sm">${message}</p>
              </div>
            </div>
          `;
          
          // Mostrar indicador de escritura
          document.getElementById('typing-indicator').classList.remove('hidden');
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
          
          // Enviar mensaje
          const result = await this.sendMessage(message);
          
          // Ocultar indicador
          document.getElementById('typing-indicator').classList.add('hidden');
          
          if (result) {
            messagesDiv.innerHTML += `
              <div class="flex justify-start fade-in">
                <div class="message-bubble bg-white text-urba-800 rounded-2xl rounded-bl-md shadow-sm border border-urba-100 px-4 py-3">
                  <p class="text-sm whitespace-pre-line">${this.formatMessage(result.assistantMessage.content)}</p>
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
