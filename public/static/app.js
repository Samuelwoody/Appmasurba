// =============================================
// MÁS URBA - Aplicación Principal
// Control y Estrategia de Vivienda
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
    isLoading: false
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
      case 'admin-client':
        content = this.renderLayout(this.renderAdminClient());
        break;
      default:
        content = this.renderLayout(this.renderDashboard());
    }
    
    app.innerHTML = content + (loadingScreen ? loadingScreen.outerHTML : '');
    this.attachEventListeners();
  },
  
  // Layout principal con navegación
  renderLayout(content) {
    const isAdmin = this.state.user?.role === 'admin';
    
    return `
      <div class="min-h-screen bg-urba-50">
        <!-- Header -->
        <header class="bg-urba-900 text-white shadow-lg">
          <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <i class="fas fa-home text-white"></i>
                </div>
                <div>
                  <h1 class="text-xl font-semibold">Más Urba</h1>
                  <p class="text-urba-300 text-xs">Control y Estrategia</p>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-urba-200 hidden sm:block">
                  <i class="fas fa-user mr-1"></i> ${this.state.user?.name || ''}
                </span>
                <button onclick="App.logout()" class="text-urba-300 hover:text-white transition">
                  <i class="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Navegación -->
        <nav class="bg-white shadow-sm border-b border-urba-100 sticky top-0 z-40">
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
        <footer class="bg-urba-800 text-urba-300 py-6 mt-12">
          <div class="max-w-7xl mx-auto px-4 text-center text-sm">
            <p>© ${new Date().getFullYear()} Más Urba · Control y Estrategia de Vivienda</p>
            <p class="text-urba-400 mt-1">Valdemorillo, Madrid</p>
          </div>
        </footer>
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
                       ? 'bg-urba-900 text-white' 
                       : 'text-urba-600 hover:bg-urba-100'}">
        <i class="fas fa-${item.icon} mr-2"></i>
        <span class="hidden sm:inline">${item.label}</span>
      </button>
    `).join('');
  },
  
  renderAdminNav() {
    const items = [
      { id: 'admin', icon: 'chart-line', label: 'Dashboard' },
      { id: 'admin-clients', icon: 'users', label: 'Clientes' }
    ];
    
    return items.map(item => `
      <button onclick="App.navigate('${item.id}')" 
              class="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
                     ${this.state.currentView === item.id 
                       ? 'bg-urba-900 text-white' 
                       : 'text-urba-600 hover:bg-urba-100'}">
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
      <div class="min-h-screen bg-gradient-to-br from-urba-900 via-urba-800 to-urba-700 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i class="fas fa-home text-4xl text-white"></i>
            </div>
            <h1 class="text-3xl font-bold text-white">Más Urba</h1>
            <p class="text-urba-300 mt-2">Control y Estrategia de Vivienda</p>
          </div>
          
          <!-- Formulario -->
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            <form id="login-form" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Email</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-urba-400">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input type="email" id="login-email" required
                         class="w-full pl-10 pr-4 py-3 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500 focus:border-transparent transition"
                         placeholder="tu@email.com">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-urba-700 mb-2">Contraseña</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-urba-400">
                    <i class="fas fa-lock"></i>
                  </span>
                  <input type="password" id="login-password" required
                         class="w-full pl-10 pr-4 py-3 border border-urba-200 rounded-lg focus:ring-2 focus:ring-urba-500 focus:border-transparent transition"
                         placeholder="••••••••">
                </div>
              </div>
              
              <div id="login-error" class="hidden text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span></span>
              </div>
              
              <button type="submit" 
                      class="w-full bg-urba-900 text-white py-3 rounded-lg font-medium hover:bg-urba-800 transition flex items-center justify-center">
                <span id="login-btn-text">Acceder</span>
                <div id="login-btn-loading" class="hidden spinner ml-2"></div>
              </button>
            </form>
            
            <div class="mt-6 pt-6 border-t border-urba-100 text-center">
              <p class="text-sm text-urba-500">
                ¿Problemas para acceder? 
                <a href="mailto:info@masurba.es" class="text-urba-700 font-medium hover:underline">Contacta con nosotros</a>
              </p>
            </div>
          </div>
          
          <!-- Demo hint -->
          <div class="mt-6 text-center">
            <p class="text-urba-400 text-sm">
              <i class="fas fa-info-circle mr-1"></i>
              Demo: cliente@demo.es / demo123
            </p>
          </div>
        </div>
      </div>
    `;
  },
  
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
        <div class="bg-gradient-to-r from-urba-900 to-urba-700 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">Hola, ${d.user?.name?.split(' ')[0] || 'Usuario'}</h2>
              <p class="text-urba-200 mt-1">Bienvenido a tu panel de control</p>
            </div>
            <div class="hidden sm:block">
              <button onclick="App.requestContact('diagnosis_360')" 
                      class="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-lg font-medium transition">
                <i class="fas fa-phone-alt mr-2"></i>
                Solicitar revisión
              </button>
            </div>
          </div>
        </div>
        
        <!-- Tarjetas principales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Score técnico -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-urba-500 text-sm font-medium">Estado técnico</p>
                <p class="text-3xl font-bold text-urba-900 mt-1">${d.technicalScore}</p>
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
          <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-urba-500 text-sm font-medium">Mantenimientos</p>
                <p class="text-3xl font-bold text-urba-900 mt-1">${d.pendingMaintenances || 0}</p>
                <p class="text-sm text-urba-500 mt-1">pendientes de revisar</p>
              </div>
              <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-tools text-2xl text-amber-600"></i>
              </div>
            </div>
            <button onclick="App.navigate('maintenance')" 
                    class="mt-4 text-sm text-urba-600 hover:text-urba-800 font-medium">
              Ver checklist <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
          
          <!-- Chari -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
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
          <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
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
    
    return `
      <div class="max-w-3xl mx-auto">
        <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-urba-900 to-urba-700 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-user-tie text-2xl text-white"></i>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-white">Chari</h2>
                <p class="text-urba-200 text-sm">Tu asistente estratégica</p>
              </div>
            </div>
          </div>
          
          <!-- Mensajes -->
          <div id="chat-messages" class="chat-container overflow-y-auto p-6 space-y-4 bg-urba-50">
            ${messages.length === 0 ? `
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-urba-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-comments text-2xl text-urba-500"></i>
                </div>
                <p class="text-urba-600 font-medium">¡Hola ${this.state.user?.name?.split(' ')[0]}!</p>
                <p class="text-urba-500 text-sm mt-2">Soy Chari, tu asistente en Más Urba.<br>Pregúntame sobre reformas, mantenimiento o estrategia.</p>
              </div>
            ` : messages.map(m => `
              <div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="message-bubble ${m.role === 'user' 
                  ? 'bg-urba-900 text-white rounded-2xl rounded-br-md' 
                  : 'bg-white text-urba-800 rounded-2xl rounded-bl-md shadow-sm border border-urba-100'} px-4 py-3">
                  <p class="text-sm whitespace-pre-line">${this.formatMessage(m.content)}</p>
                  <p class="text-xs ${m.role === 'user' ? 'text-urba-300' : 'text-urba-400'} mt-1">
                    ${this.formatTime(m.timestamp)}
                  </p>
                </div>
              </div>
            `).join('')}
            <div id="typing-indicator" class="hidden flex justify-start">
              <div class="bg-white rounded-2xl rounded-bl-md shadow-sm border border-urba-100 px-4 py-3">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-urba-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-urba-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-urba-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Input -->
          <form id="chat-form" class="p-4 bg-white border-t border-urba-100">
            <div class="flex space-x-3">
              <input type="text" id="chat-input" 
                     class="flex-1 px-4 py-3 border border-urba-200 rounded-xl focus:ring-2 focus:ring-urba-500 focus:border-transparent"
                     placeholder="Escribe tu mensaje..."
                     autocomplete="off">
              <button type="submit" 
                      class="bg-urba-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-urba-800 transition">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
            <p class="text-xs text-urba-400 mt-2 text-center">
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
  // ADMIN (SAMUEL)
  // =============================================
  renderAdmin() {
    return `
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-urba-900 to-urba-700 rounded-2xl p-6 text-white">
          <h2 class="text-2xl font-bold">Panel de Administración</h2>
          <p class="text-urba-200 mt-1">Gestiona tus clientes y solicitudes</p>
        </div>
        
        <div id="admin-content">
          ${this.renderLoading()}
        </div>
      </div>
    `;
  },
  
  renderAdminClient() {
    return `
      <div class="space-y-6">
        <button onclick="App.navigate('admin')" class="text-urba-600 hover:text-urba-800">
          <i class="fas fa-arrow-left mr-2"></i> Volver
        </button>
        
        <div id="client-detail">
          ${this.renderLoading()}
        </div>
      </div>
    `;
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
    // Por implementar: modal para notas
    alert('Función de notas próximamente');
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
          btnText.textContent = 'Acceder';
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
    
    // Chat form
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
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
      
      // Cargar conversación
      this.loadConversation().then(() => this.render());
    }
    
    // Admin content
    if (this.state.currentView === 'admin' && this.state.user?.role === 'admin') {
      this.loadAdminDashboard();
    }
  },
  
  async loadAdminDashboard() {
    try {
      const response = await axios.get('/api/admin/dashboard');
      if (response.data.success) {
        const d = response.data.data;
        const adminContent = document.getElementById('admin-content');
        
        if (adminContent) {
          adminContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
                <p class="text-urba-500 text-sm">Total clientes</p>
                <p class="text-3xl font-bold text-urba-900">${d.totalClients}</p>
              </div>
              <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
                <p class="text-urba-500 text-sm">Solicitudes pendientes</p>
                <p class="text-3xl font-bold text-amber-600">${d.pendingRequests}</p>
              </div>
              <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
                <p class="text-urba-500 text-sm">Conversaciones (7 días)</p>
                <p class="text-3xl font-bold text-urba-900">${d.recentConversations}</p>
              </div>
              <div class="bg-white rounded-xl shadow-sm p-6 border border-urba-100">
                <p class="text-urba-500 text-sm">Clientes inactivos</p>
                <p class="text-3xl font-bold text-red-600">${d.inactiveClients?.length || 0}</p>
              </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-urba-100 overflow-hidden">
              <div class="bg-urba-50 px-6 py-4 border-b border-urba-100">
                <h3 class="font-semibold text-urba-900">Últimas solicitudes</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-urba-50 text-left">
                    <tr>
                      <th class="px-6 py-3 text-sm font-medium text-urba-600">Cliente</th>
                      <th class="px-6 py-3 text-sm font-medium text-urba-600">Tipo</th>
                      <th class="px-6 py-3 text-sm font-medium text-urba-600">Estado</th>
                      <th class="px-6 py-3 text-sm font-medium text-urba-600">Fecha</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-urba-100">
                    ${(d.latestRequests || []).map(r => `
                      <tr class="hover:bg-urba-50">
                        <td class="px-6 py-4">
                          <p class="font-medium text-urba-900">${r.user_name}</p>
                          <p class="text-sm text-urba-500">${r.user_email}</p>
                        </td>
                        <td class="px-6 py-4 text-sm text-urba-700">${r.request_type}</td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-1 text-xs rounded-full ${
                            r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            r.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }">${r.status}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-urba-500">${this.formatDate(r.created_at)}</td>
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
    }
  }
};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => App.init());
