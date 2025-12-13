// main.js

// ===============================
// 1. Inicialización de Supabase
// ===============================
(function () {
  if (!window.supabase) {
    console.error("Supabase CDN no se ha cargado correctamente");
    throw new Error("Supabase CDN no disponible");
  }

  const SUPABASE_URL = "https://kkmppwpubwsknqumjblw.supabase.co";
  const SUPABASE_ANON_KEY =
    "sb_publishable_lRVrzVTsE31OgjmqUuMazQ_asFyeVSf";

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  console.log("Supabase inicializado correctamente");
})();

function getSupabaseClient() {
  if (!window.supabaseClient) {
    throw new Error("SupabaseClient no está inicializado");
  }
  return window.supabaseClient;
}

// ===============================
// 2. Lógica común UI
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  }

  initAuthPages();
  initProtectedPage();
});

// ===============================
// 3. Autenticación (login + registro)
// ===============================
function initAuthPages() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registroForm");
  const supabase = getSupabaseClient();

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      if (!emailInput || !passwordInput) {
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
        window.location.href = "admin-dashboard.html";
      } catch (err) {
        console.error("Error inesperado en login:", err);
        alert("Ha ocurrido un error inesperado al iniciar sesión.");
      }
    });
  }

  // REGISTRO
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
        // 1) Crear usuario auth
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

        // 2) Insertar en 'empresas'
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
            estado: "pendiente",
            aprobado: false,
            created_at: new Date().toISOString(),
            user_id: data.user.id,
          });

          if (insertError) {
            console.error(
              "Usuario creado pero error insertando en empresas:",
              insertError
            );
          }
        }

        alert(
          "Registro correcto. Tu empresa queda pendiente de aprobación por un administrador."
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
// 4. Protección de admin-dashboard
// ===============================
async function initProtectedPage() {
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
// 5. Logout global (onclick="logout()")
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