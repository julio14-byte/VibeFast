/// ============================================================
// VibeFast · config.js
// ------------------------------------------------------------
// ESTE ES EL ARCHIVO MÁS IMPORTANTE DEL BOILERPLATE.
// Todo el branding, copy, features y configuración del producto vive aquí.
// Cambiar este archivo cambia el producto entero — sin abrir JSX.
//
// Estructura:
//   - app:      identidad del producto (nombre, descripción, dominio, color)
//   - features: toggles para encender/apagar funcionalidades
//   - ai:       configuración de OpenAI
//   - email:    configuración de Resend
//   - auth:     providers habilitados
//   - landing:  copy de la página pública
//   - pricing:  planes (si features.payments está activo)
//
// Tip Sem 1: empieza editando `app` y `landing.hero` con los datos de tu producto.
// ============================================================

const config = {
  // -----------------------------------------------------------
  // Identidad del producto
  // -----------------------------------------------------------
  app: {
    name: "SmartPOS",
    description:
      "Punto de venta y gestión de inventarios inteligente para comercios tradicionales y ferreterías.",
    domain: "mostrador.app", // sin https://, sin www
    locale: "es", // "es" | "en"
    // URL pública: usa NEXT_PUBLIC_APP_URL en .env. En este config solo definimos el default.
    defaultUrl: "http://localhost:3000",
  },

  // -----------------------------------------------------------
  // Identidad visual
  // -----------------------------------------------------------
  brand: {
    // Color primario en HEX. DaisyUI lo aplica como --color-primary via theme.
    primary: "#D97706", // amber-600 (calidez industrial, ferretería)
    // Logo: puede ser texto o ruta a /public/logo.svg
    logoText: "SmartPOS",
    logoSrc: null,
    // Estilo del bordeado global (DaisyUI usa esto para botones, cards)
    radius: "1rem",
  },

  // -----------------------------------------------------------
  // Toggles de features — encienden/apagan rutas y componentes
  // -----------------------------------------------------------
  features: {
    waitlist: true, // Captura emails en landing — Sem 1
    googleAuth: true, // Login con Google — Sem 2
    emailLogin: true, // Email + contraseña
    usernameLogin: false, // Usuario + contraseña (sin email visible)
    aiChat: true, // Chat AI en /chat — Sem 3
    toolUse: true, // Tool use registry — Sem 4
    agents: true, // LangGraph agents — Sem 5
    mcp: true, // Servidor MCP en /api/mcp y /api/mcp/productos — Sem 5
    rag: false, // RAG con pgvector — opcional
    posthog: true, // Tracking — opcional
    resend: true, // Email — Sem 1+
    pricing: true, // Muestra la sección de precios en la landing (vitrina; el cobro real es `payments`)
    payments: true, // Stripe suscripciones — Fase 1 SaaS
    hardware: false, // ESP-Claw bridge — Sem 8
  },

  // Métricas globales del producto (waitlist, signups, chat) en el dashboard.
  // Requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.
  productMetrics: {
    enabled: true,
    // Vacío = cualquier usuario autenticado (MVP single-founder).
    founderEmails: [],
  },

  // -----------------------------------------------------------
  // OpenAI
  // -----------------------------------------------------------
  ai: {
    chatModel: "gpt-4o-mini", // default barato y rápido
    structuredModel: "gpt-4o-mini",
    cursorModel: "composer-2.5", // cuando usas CURSOR_API_KEY + proxy local
    agentModel: "gpt-4o", // los agentes razonan mejor con full gpt-4o
    embeddingModel: "text-embedding-3-small",
    maxTokens: 1500,
    temperature: 0.4,
  },

  // -----------------------------------------------------------
  // Resend (email transaccional)
  // -----------------------------------------------------------
  email: {
    // Asegúrate de tener el dominio verificado en Resend antes de cambiar `from`.
    // En desarrollo Resend permite enviar a tu propio correo desde `onboarding@resend.dev`.
    from: "VibeFast <onboarding@resend.dev>",
    replyTo: "juliobitar14@gmail.com",
    supportEmail: "juliobitar14@gmail.com",
  },

  // -----------------------------------------------------------
  // Auth providers
  // -----------------------------------------------------------
  auth: {
    loginUrl: "/login",
    afterLoginUrl: "/dashboard",
    afterLogoutUrl: "/",
    providers: ["google", "email"], // sincronizado con features
  },

  // -----------------------------------------------------------
  // Landing — todo el copy de la página pública
  // -----------------------------------------------------------
  landing: {
    nav: [
      { label: "Características", href: "#features" },
      { label: "Precios", href: "#pricing" },
      { label: "Preguntas", href: "#faq" },
      { label: "Docs", href: "/docs" },
    ],
    hero: {
      eyebrow: "Para ferreterías y tiendas de barrio",
      title: "Encuentra cualquier pieza y controla tu inventario hablando.",
      subtitle:
        "Mostrador usa IA conversacional para que atiendas más rápido en el mostrador y sepas al instante qué te falta en anaquel.",
      cta: { label: "Solicitar acceso", href: "#waitlist" },
      ctaSecondary: { label: "Ver docs", href: "/docs" },
    },
    problem: {
      eyebrow: "El problema",
      title: "Construir el andamiaje mata tu momentum.",
      subtitle:
        "La mayoría de founders se atoran semanas configurando lo mismo antes de tocar su idea real.",
      items: [
        {
          icon: "Timer",
          title: "Semanas en boilerplate",
          body: "Auth, base de datos, deploy, emails… configuras lo mismo que todos antes de validar nada.",
        },
        {
          icon: "Puzzle",
          title: "Parálisis por herramientas",
          body: "Cada capa tiene 10 opciones. Comparas en vez de construir y pierdes el hilo.",
        },
        {
          icon: "PlugZap",
          title: "La IA no se integra sola",
          body: "Structured outputs, tool use, agentes y MCP suenan bien hasta que hay que cablearlos.",
        },
      ],
    },
    features: {
      eyebrow: "Lo que ya viene listo",
      title: "Stack completo, una sola decisión por capa.",
      subtitle: "No pierdes tiempo eligiendo herramientas. Te enfocas en tu producto.",
      items: [
        {
          icon: "Search",
          title: "Busca piezas al instante",
          body: "Pregunta en lenguaje natural y encuentra la pieza correcta sin hojear catálogos lentos.",
        },
        {
          icon: "Package",
          title: "Inventario siempre al día",
          body: "Sabe qué falta en anaquel y qué reordenar antes de perder ventas por desabasto.",
        },
        {
          icon: "Mic",
          title: "Atiende desde el mostrador",
          body: "Habla o escribe mientras atiendes clientes; la IA no te saca del piso de venta.",
        },
      ],
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Lo que todo founder pregunta antes de arrancar.",
      items: [
        {
          q: "¿Funciona si mi inventario está desordenado o solo en Excel?",
          a: "Sí. Mostrador está pensado para comercios que parten de listas incompletas o hojas de cálculo; te ayudamos a ordenar el catálogo mientras ya lo usas en el mostrador.",
        },
        {
          q: "¿Necesito comprar cámaras, lectores o equipo nuevo?",
          a: "No. Funciona desde tu celular o computadora en el mostrador; no requiere hardware especial ni cambiar tu caja registradora.",
        },
        {
          q: "¿Cuánto tarda en implementarse en mi ferretería?",
          a: "La mayoría de tiendas empieza a usarlo el mismo día: cargas tu catálogo básico y en minutos ya puedes buscar piezas y consultar existencias.",
        },
        {
          q: "¿Qué pasa si se va el internet en el local?",
          a: "Las consultas de inventario recientes quedan disponibles sin conexión; al reconectar, el stock se sincroniza automáticamente.",
        },
      ],
    },
    socialProof: {
      text: "Founders del curso ya lanzaron con este stack",
      logos: ["Remotto", "Startup Chihuahua", "Next.js", "Supabase", "OpenAI", "Vercel"],
    },
    testimonials: {
      eyebrow: "Prueba social",
      title: "Founders que ya lanzaron con VibeFast.",
      subtitle: "Testimonios de cohortes anteriores del curso.",
      items: [
        {
          quote:
            "Pasé de una idea en Notion a un MVP con IA en producción en dos semanas. Nunca había tocado código.",
          author: "Ana Márquez",
          role: "Founder · Fisio en casa",
        },
        {
          quote:
            "El boilerplate ya traía auth, base de datos y el agente cableados. Solo describí lo que quería en Cursor.",
          author: "Diego Sáenz",
          role: "Founder · Tutor IA",
        },
        {
          quote:
            "Las docs semana a semana fueron mi mapa. Copiaba el prompt, ajustaba y avanzaba sin atorarme.",
          author: "Lucía Fernández",
          role: "Founder · Recetario inteligente",
        },
      ],
    },
    finalCta: {
      eyebrow: "Tu turno",
      title: "Deja de configurar. Empieza a construir.",
      subtitle:
        "Clona la plantilla, edita config.js y ten tu producto AI-native en producción esta semana.",
      cta: { label: "Únete al waitlist", href: "#waitlist" },
      ctaSecondary: { label: "Leer las docs", href: "/docs" },
    },
    waitlist: {
      eyebrow: "Únete primero",
      title: "Sé de los primeros en saber.",
      subtitle: "Te avisamos cuando abramos cupos para la siguiente cohorte.",
      successMessage: "¡Listo! Te avisamos en cuanto haya novedades.",
      buttonLabel: "Quiero entrar",
      placeholder: "tu@email.com",
    },
    footer: {
      tagline: "Construido para founders. Por Remotto × Startup Chihuahua.",
      columns: [
        {
          title: "Producto",
          links: [
            { label: "Características", href: "#features" },
            { label: "Precios", href: "#pricing" },
            { label: "Preguntas", href: "#faq" },
          ],
        },
        {
          title: "Recursos",
          links: [
            { label: "Docs", href: "/docs" },
            { label: "Quick start", href: "/docs/setup/quick-start" },
            { label: "Troubleshooting", href: "/docs/troubleshooting/errores-comunes" },
          ],
        },
        {
          title: "Comunidad",
          links: [
            { label: "GitHub", href: "https://github.com/arampersand/VibeFast", external: true },
            { label: "Remotto", href: "https://remotto.com", external: true },
          ],
        },
      ],
      // Compat: links planos usados en el bar inferior
      links: [
        { label: "Docs", href: "/docs" },
        { label: "GitHub", href: "https://github.com/arampersand/VibeFast", external: true },
      ],
    },
  },

  // -----------------------------------------------------------
  // Pricing — vitrina de planes.
  // Se muestra en la landing si features.pricing === true.
  // El cobro real (Stripe) depende de features.payments.
  // -----------------------------------------------------------
  pricing: {
    eyebrow: "Precios",
    title: "Rentabiliza tu ferretería.",
    subtitle: "14 días gratis. Luego un plan mensual simple vía Stripe.",
    plans: [
      {
        id: "starter",
        name: "Starter",
        price: 0,
        currency: "MXN",
        interval: "mes",
        description: "Prueba el POS e inventario en tu mostrador.",
        features: [
          "14 días de prueba",
          "Hasta 200 productos",
          "1 usuario",
          "Ventas y tickets",
        ],
        cta: "Empezar gratis",
      },
      {
        id: "pro",
        name: "Ferretería Pro",
        price: 599,
        currency: "MXN",
        interval: "mes",
        description: "Para negocios que ya facturan todos los días.",
        features: [
          "Hasta 5.000 productos",
          "3 usuarios (próximamente)",
          "Importación CSV masiva",
          "Chat IA + agente LangGraph",
          "Facturación CFDI",
        ],
        cta: "Suscribirse a Pro",
        highlighted: true,
        stripePriceId: "", // o STRIPE_PRICE_ID_PRO en .env.local
      },
    ],
  },
}

export default config