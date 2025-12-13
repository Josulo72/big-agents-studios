// main.js

// ===============================
// 1. Inicialización de Supabase
// ===============================
(function () {
  // Comprobar que el CDN de Supabase se ha cargado
  if (!window.supabase) {
    console.error("Supabase CDN no se ha cargado correctamente");
    throw new Error("Supabase CDN no disponible");
  }

  // CREDENCIALES DE TU PROYECTO SUPABASE
  // ------------------------------------
  // URL de tu proyecto (esta viene de tu panel de Supabase)
  const SUPABASE_URL = "https://kkmppwpubwsknqumjblw.supabase.co";

  // ANON KEY de tu proyecto (copiar COMPLETA desde Supabase → Settings → API)
  // OJO: cambia SOLO el valor del string manteniendo las comillas.
  const SUPABASE_ANON_KEY =
    "PON_AQUI_TU_SUPABASE_ANON_KEY_COMPLETA_ENTRE_COMILLAS";

  // Cliente global
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  console.log("Supabase inicializado correctamente");
})();

// Helper para obtener el cliente en cualquier parte
function getSupabaseClient() {
  if (!window.supabaseClient) {
    throw new Error("SupabaseClient no está inicializado");
  }
  return window.supabaseClient;
}

// ===============================
// 2. Lógica común UI (navbar, etc.)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // Hamburguesa menú móvil (si existe)
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  }

  // Inicializar la lógica específica según la página
  initAuthPages();
  initProtectedPage();
});

// ===============================
// 3. Lógica de autenticación
//    (login + registro)
// ===============================
function initAuthPages() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registroForm");

  const supabase = getSupabaseClient();

  // ---- LOGIN ----
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      if (!emailInput || !passwordInput) {
        console.error("Campos de login no encontrados en el DOM");
        alert("Error interno: campos de login no encontrados.");
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        alert("Por favor, introduce email y contraseña.");
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Error al iniciar sesión:", error);
          alert("Error al iniciar sesión: " + error.message);
          return;
        }

        console.log("Login correcto:", data);

        // Redirigir al panel de administración
        window.location.href = "admin-dashboard.html";
      } catch (err) {
        console.error("Error inesperado en login:", err);
        alert("Ha ocurrido un error inesperado al iniciar sesión.");
      }
    });
  }

  // ---- REGISTRO ----
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombreEmpresaInput = document.getElementById("nombreEmpresa");
      const cifInput = document.getElementById("cif");
      const industriaInput = document.getElementById("industria");
      const tamanoInput = document.getElementById("tamano");
      const nombreContactoInput = document.getElementById("nombreContacto");
      const cargoContactoInput = document.getElementById("cargoContacto");
      const emailInput = document.getElementById("email");
      const telefonoInput = document.getElementById("telefono");
      const sitioWebInput = document.getElementById("sitioWeb");
      const necesidadesInput = document.getElementById("necesidades");
      const presupuestoInput = document.getElementById("presupuesto");
      const passwordInput = document.getElementById("password");

      if (
        !nombreEmpresaInput ||
        !cifInput ||
        !industriaInput ||
        !tamanoInput ||
        !nombreContactoInput ||
        !cargoContactoInput ||
        !emailInput ||
        !telefonoInput ||
        !necesidadesInput ||
        !presupuestoInput ||
        !passwordInput
      ) {
        console.error("Campos de registro no encontrados en el DOM");
        alert("Error interno: campos de registro no encontrados.");
        return;
      }

      const empresa = nombreEmpresaInput.value.trim();
      const cif = cifInput.value.trim();
      const industria = industriaInput.value;
      const tamano = tamanoInput.value;
      const nombreContacto = nombreContactoInput.value.trim();
      const cargoContacto = cargoContactoInput.value.trim();
      const email = emailInput.value.trim();
      const telefono = telefonoInput.value.trim();
      const sitioWeb = sitioWebInput ? sitioWebInput.value.trim() : "";
      const necesidades = necesidadesInput.value.trim();
      const presupuesto = presupuestoInput.value;
      const password = passwordInput.value;

      if (
        !empresa ||
        !cif ||
        !industria ||
        !tamano ||
        !nombreContacto ||
        !cargoContacto ||
        !email ||
        !telefono ||
        !necesidades ||
        !presupuesto ||
        !password
      ) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
      }

      try {
        // 1) Crear usuario de autenticación
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              empresa,
              cif,
            },
          },
        });

        if (error) {
          console.error("Error al registrar usuario:", error);
          alert("Error al registrar: " + error.message);
          return;
        }

        console.log("Registro correcto (auth):", data);

        // 2) Insertar en la tabla 'empresas'
        if (data.user) {
          const { error: insertError } = await supabase.from("empresas").insert({
            id: data.user.id,
            nombre_empresa: empresa,
            cif: cif,
            industria: industria,
            tamano: tamano,
            nombre_contacto: nombreContacto,
            cargo_contacto: cargoContacto,
            email: email,
            telefono: telefono,
            sitio_web: sitioWeb || null,
            necesidades: necesidades,
            presupuesto: presupuesto,
            aprobado: false,
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error(
              "Usuario creado pero error insertando en empresas:",
              insertError
            );
          }
        }

        alert(
          "Registro correcto. Revisa tu email si tienes confirmación activada, o espera a que un administrador apruebe tu cuenta."
        );
        window.location.href = "login.html";
      } catch (err) {
        console.error("Error inesperado en registro:", err);
        alert("Ha ocurrido un error inesperado al registrar la empresa.");
      }
    });
  }
}

// ===============================
// 4. Protección de rutas
//    (admin-dashboard.html)
// ===============================
async function initProtectedPage() {
  // Solo se ejecuta en admin-dashboard.html
  const isAdminDashboard = window.location.pathname.endsWith(
    "admin-dashboard.html"
  );
  if (!isAdminDashboard) return;

  const supabase = getSupabaseClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error al obtener sesión:", error);
      window.location.href = "login.html";
      return;
    }

    if (!session) {
      console.warn("No hay sesión activa, redirigiendo a login...");
      window.location.href = "login.html";
      return;
    }

    console.log("Sesión activa:", session);
  } catch (err) {
    console.error("Error inesperado comprobando sesión:", err);
    window.location.href = "login.html";
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión: " + error.message);
        return;
      }
      window.location.href = "login.html";
    });
  }
}

// ===============================
// 5. Función global de logout
//    (para el enlace onclick="logout()")
// ===============================
async function logout() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión: " + error.message);
      return;
    }
  } catch (err) {
    console.error("Error inesperado al cerrar sesión:", err);
  } finally {
    window.location.href = "login.html";
  }
}