// Every piece of copy and every link lives here, in English and Spanish.
// Text wrapped in **double asterisks** renders bold (see <Rich /> in src/i18n).
// The name "Santiago / Boada.dev" and brand names never get translated.

export type Lang = 'en' | 'es'
export type L = Record<Lang, string>

export const LINKS = {
  site: 'santiagoboada.dev',
  liveApp: 'https://finance.santiagoboada.dev',
  liveAppHost: 'finance.santiagoboada.dev',
  github: 'https://github.com/Zarvi16G',
  linkedin: 'https://www.linkedin.com/in/santiago-boada-rivas-6b4a392a4/',
  email: 'proyectos@santiagoboada.dev',
}

export const NAME_LINES = ['Santiago', 'Boada.dev'] as const

export const META = {
  title: { en: 'Santiago Boada · Web Developer', es: 'Santiago Boada · Desarrollador Web' },
  description: {
    en: 'Santiago Boada, self-taught web developer in Bogotá, Colombia. Full-stack, 3D on the web and the servers it runs on.',
    es: 'Santiago Boada, desarrollador web autodidacta en Bogotá, Colombia. Full-stack, 3D en la web y los servidores donde corre.',
  },
} satisfies Record<string, L>

// ---- Section keys (top) ----
export type SectionId = 'skills' | 'projects' | 'experience' | 'about' | 'contact'
export const SECTIONS: { id: SectionId; icon: string; label: L }[] = [
  { id: 'skills', icon: 'Skills', label: { en: 'Skills', es: 'Habilidades' } },
  { id: 'projects', icon: 'Projects', label: { en: 'Projects', es: 'Proyectos' } },
  { id: 'experience', icon: 'Experience', label: { en: 'Experience', es: 'Experiencia' } },
  { id: 'about', icon: 'About', label: { en: 'About', es: 'Sobre mí' } },
  { id: 'contact', icon: 'Contact', label: { en: 'Contact', es: 'Contacto' } },
]

// ---- Category tiles (bottom): icon + name only ----
export const CATEGORIES: { icon: string; label: L }[] = [
  { icon: 'Frontend', label: { en: 'Frontend', es: 'Frontend' } },
  { icon: '3D', label: { en: '3D', es: '3D' } },
  { icon: 'Backend', label: { en: 'Backend', es: 'Backend' } },
  { icon: 'Data', label: { en: 'Data', es: 'Datos' } },
  { icon: 'AI', label: { en: 'AI', es: 'IA' } },
  { icon: 'Tools', label: { en: 'Tools', es: 'Recursos' } },
]

// ---- Shared UI ----
export const UI = {
  sectionsNav: { en: 'Sections', es: 'Secciones' },
  tilesNav: { en: 'What I work on', es: 'En qué trabajo' },
  back: { en: 'Back to portfolio', es: 'Volver al portafolio' },
  langToggle: { en: 'Language', es: 'Idioma' },
  nameLabel: { en: 'Santiago Boada.dev. Press to replay the intro.', es: 'Santiago Boada.dev. Presiona para repetir la intro.' },
  webglError: {
    en: 'The 3D view could not load. Check that WebGL is enabled in your browser.',
    es: 'La vista 3D no pudo cargar. Revisa que WebGL esté activado en tu navegador.',
  },
} satisfies Record<string, L>

// ---- Speech bubbles and watering ----
export const BUBBLES = {
  personLabel: { en: 'Message from Santiago', es: 'Mensaje de Santiago' },
  person: { en: 'Hey, you! Want to **hire me**, or need a **freelance project**?', es: '¡Hey, tú! ¿Quieres **contratarme** o necesitas un **proyecto freelance**?' },
  talk: { en: "Let's talk", es: 'Hablemos' },
  plantLabel: { en: 'Message from the plant', es: 'Mensaje de la planta' },
  plant: { en: "What's up? I'm a little thirsty... can you **water me**?", es: '¿Qué tal? Tengo un poquito de sed... ¿me **riegas**?' },
  water: { en: 'Water the plant', es: 'Regar la planta' },
  watering: { en: 'Ahh... **glug glug**', es: 'Ahh... **glu glu**' },
  thanks: { en: 'Thank you! I feel **brand new**.', es: '¡Gracias! Me siento **como nueva**.' },
} satisfies Record<string, L>

// ---- Skills ----
export const SKILLS_UI = {
  eyebrow: { en: 'Skills', es: 'Habilidades' },
  title: { en: 'What I work with', es: 'Con qué trabajo' },
  intro: { en: 'Hover a category to turn the die.', es: 'Pasa el mouse por una categoría para girar el dado.' },
  count: { en: '{n} skills', es: '{n} habilidades' },
  dieWord: { en: 'SKILLS', es: 'HABILIDADES' },
  dieLabel: { en: 'Skills die: hover a category card to turn it', es: 'Dado de habilidades: pasa el mouse por una categoría para girarlo' },
} satisfies Record<string, L>

export const SKILL_CATEGORIES: { id: string; name: L; skills: string[] }[] = [
  { id: 'frontend', name: { en: 'Frontend', es: 'Frontend' }, skills: ['React', 'TypeScript', 'Vite', 'HTML & CSS', 'Tailwind'] },
  { id: '3d', name: { en: '3D & Graphics', es: '3D y gráficos' }, skills: ['Three.js', 'React Three Fiber', 'Drei', 'GLSL Shaders', 'Blender'] },
  { id: 'backend', name: { en: 'Backend', es: 'Backend' }, skills: ['Django', 'REST APIs', 'Django REST Framework'] },
  { id: 'databases', name: { en: 'Databases', es: 'Bases de datos' }, skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'] },
  { id: 'devops', name: { en: 'DevOps & Tools', es: 'DevOps y herramientas' }, skills: ['Git', 'GitHub Actions', 'Docker', 'Vercel'] },
  { id: 'design', name: { en: 'Design', es: 'Diseño' }, skills: ['Figma', 'UI / UX', 'Motion'] },
]

// ---- Projects ----
export const PROJECTS = {
  eyebrow: { en: 'Projects', es: 'Proyectos' },
  title: { en: "Things I've built", es: 'Lo que he construido' },
  count: { en: '1 live · 1 in progress', es: '1 en línea · 1 en progreso' },
  meta: { en: 'Personal finance · Web app', es: 'Finanzas personales · App web' },
  live: { en: 'Live', es: 'En línea' },
  name: 'Patrimonio',
  pitch: {
    en: 'A personal finance app that measures net worth, not just cash flow: what you own, minus what you owe.',
    es: 'Una app de finanzas personales que mide el patrimonio, no solo el flujo de caja: lo que tienes menos lo que debes.',
  },
  features: [
    { en: '**Net worth registry:** assets against debts, and liquid money against what is locked in.', es: '**Registro patrimonial:** activos frente a deudas, y dinero líquido frente a lo inmovilizado.' },
    { en: '**Financial health:** savings rate, months of emergency fund and debt-to-income, each with a plain verdict.', es: '**Salud financiera:** tasa de ahorro, meses de fondo de emergencia y deuda sobre ingreso, cada uno con un veredicto claro.' },
    { en: '**Multi-currency:** every movement keeps the currency it happened in; totals convert to COP.', es: '**Multimoneda:** cada movimiento guarda la moneda en que ocurrió; los totales se convierten a COP.' },
    { en: '**Two-step login** with an authenticator app.', es: '**Inicio de sesión en dos pasos** con app de autenticación.' },
  ] as L[],
  builtLabel: { en: 'How it is built', es: 'Cómo está construido' },
  chips: [
    { icon: 'Frontend', label: { en: 'Frontend', es: 'Frontend' } },
    { icon: 'Backend', label: { en: 'Backend', es: 'Backend' } },
    { icon: 'Data', label: { en: 'Data', es: 'Datos' } },
    { icon: 'Tools', label: { en: 'Self-hosted on a VPS', es: 'Alojado en un VPS propio' } },
  ] as { icon: string; label: L }[],
  visit: { en: 'Visit live site', es: 'Ver sitio en vivo' },
  github: { en: 'More projects on GitHub', es: 'Más proyectos en GitHub' },
  caseStudy: { en: 'Case study · soon', es: 'Caso de estudio · pronto' },
  nextTitle: { en: '02 · Next project', es: '02 · Próximo proyecto' },
  nextText: { en: 'In progress. It lands here when it ships.', es: 'En progreso. Aparecerá aquí cuando esté listo.' },
  // The mini dashboard inside the browser frame (Spanish = the app's original labels)
  mock: {
    aria: {
      en: 'Preview of the Patrimonio dashboard: net worth, monthly income and spending, and financial health badges.',
      es: 'Vista previa del panel de Patrimonio: patrimonio neto, ingresos y gastos del mes, e indicadores de salud financiera.',
    },
    nav: {
      en: ['Dashboard', 'Movements', 'Debts', 'Goals', 'Experiences', 'Net worth', 'Wealthness'],
      es: ['Panel', 'Movimientos', 'Deudas', 'Metas', 'Experiencias', 'Patrimonio', 'Bienestar'],
    },
    period: { en: 'December 2026 · totals in COP', es: 'Diciembre 2026 · totales en COP' },
    hello: { en: 'Good afternoon, Zarvi.', es: 'Buenas tardes, Zarvi.' },
    netWorth: { en: 'Net worth', es: 'Patrimonio neto' },
    growth: { en: '+12,4 % in 12 months', es: '+12,4 % en 12 meses' },
    income: { en: 'Income', es: 'Ingresos' },
    spending: { en: 'Spending', es: 'Gastos' },
    health: [
      { en: 'Savings rate 60 % · Solid', es: 'Tasa de ahorro 60 % · Sólida' },
      { en: 'Emergency fund 4,5 mo · Enough', es: 'Fondo de emergencia 4,5 meses · Suficiente' },
      { en: 'Debt / income 28,5 % · Healthy', es: 'Deuda / ingreso 28,5 % · Sana' },
    ] as L[],
  },
}

// ---- Experience ----
export type Checkpoint = {
  n: '01' | '02' | '03'
  kind: 'done' | 'now' | 'goal'
  label: L
  company: L
  when: L
  aria: L
  context: L
  role: L
  lead: L
  bullets: L[]
  tags: L[]
  whyLabel: L
  why: L
}

export const EXPERIENCE = {
  eyebrow: { en: 'Experience', es: 'Experiencia' },
  title: { en: 'The road so far', es: 'El camino hasta ahora' },
  hintHover: { en: 'It starts at the bottom. Hover a coin to open the checkpoint.', es: 'Empieza abajo. Pasa el mouse por una moneda para abrir el checkpoint.' },
  hintTap: { en: 'It starts at the bottom. Tap a coin to open the checkpoint.', es: 'Empieza abajo. Toca una moneda para abrir el checkpoint.' },
  start: { en: 'START', es: 'INICIO' },
  here: { en: 'YOU ARE HERE', es: 'ESTÁS AQUÍ' },
  current: { en: 'Current', es: 'Actual' },
  flag: 'SB.dev',
  checkpoints: [
    {
      n: '01',
      kind: 'done',
      label: { en: 'CHECKPOINT 01', es: 'CHECKPOINT 01' },
      company: { en: 'Teleperformance', es: 'Teleperformance' },
      when: { en: '2025', es: '2025' },
      aria: { en: 'Checkpoint 01, Teleperformance, 2025. Show details.', es: 'Checkpoint 01, Teleperformance, 2025. Ver detalles.' },
      context: { en: 'BPO · tech-company account', es: 'BPO · cuenta de empresa tecnológica' },
      role: { en: 'Technical Support · Call center', es: 'Soporte técnico · Call center' },
      lead: {
        en: 'Solved hardware and software problems for customers of a tech company, guiding them step by step until it worked.',
        es: 'Resolví problemas de hardware y software para clientes de una empresa tecnológica, guiándolos paso a paso hasta que funcionara.',
      },
      bullets: [
        { en: 'Diagnosed hardware faults and software errors live, on the call, and walked users through the fix.', es: 'Diagnostiqué fallas de hardware y errores de software en vivo, durante la llamada, y acompañé al usuario hasta la solución.' },
        { en: 'Learned how the product works end to end, to find the cause of a bug without touching the code.', es: 'Aprendí cómo funciona el producto de punta a punta para encontrar la causa de un error sin tocar el código.' },
        { en: 'Turned technical answers into plain language for non-technical users.', es: 'Traduje respuestas técnicas a un lenguaje simple para usuarios no técnicos.' },
      ],
      tags: [
        { en: 'Hardware', es: 'Hardware' },
        { en: 'Software troubleshooting', es: 'Solución de problemas de software' },
        { en: 'Root-cause analysis', es: 'Análisis de causa raíz' },
        { en: 'Customer communication', es: 'Comunicación con clientes' },
      ],
      whyLabel: { en: 'Why it matters:', es: 'Por qué importa:' },
      why: { en: 'methodical debugging and explaining technical problems clearly.', es: 'depuración metódica y explicar problemas técnicos con claridad.' },
    },
    {
      n: '02',
      kind: 'now',
      label: { en: 'CHECKPOINT 02', es: 'CHECKPOINT 02' },
      company: { en: 'Sutherland', es: 'Sutherland' },
      when: { en: '2026 – Now', es: '2026 – Hoy' },
      aria: { en: 'Checkpoint 02, Sutherland, 2026 to now, where I am now. Show details.', es: 'Checkpoint 02, Sutherland, 2026 a hoy, donde estoy ahora. Ver detalles.' },
      context: { en: 'BPO · web hosting client: VPS, hosting, email, domains', es: 'BPO · cliente de hosting web: VPS, hosting, correo, dominios' },
      role: { en: 'Technical Support · Web development & infrastructure', es: 'Soporte técnico · Desarrollo web e infraestructura' },
      lead: {
        en: "I look after customers' websites and servers from start to finish, applying web development on every case.",
        es: 'Acompaño los sitios web y servidores de los clientes de principio a fin, aplicando desarrollo web en cada caso.',
      },
      bullets: [
        { en: 'Migrate websites, email accounts and databases between plans and servers.', es: 'Migro sitios web, cuentas de correo y bases de datos entre planes y servidores.' },
        { en: 'Build first websites for small businesses with WordPress and AI site builders.', es: 'Creo primeros sitios web para pequeños negocios con WordPress y constructores con IA.' },
        { en: 'Fix infrastructure issues: DNS, domains, SSL certificates, and sizing VPS resources (CPU, RAM) so a project can run.', es: 'Resuelvo problemas de infraestructura: DNS, dominios, certificados SSL y dimensionar recursos de VPS (CPU, RAM) para que un proyecto funcione.' },
        { en: 'Work on Linux servers over SSH: logs, services and permissions.', es: 'Trabajo en servidores Linux por SSH: logs, servicios y permisos.' },
      ],
      tags: [
        { en: 'cPanel / WHM / Plesk', es: 'cPanel / WHM / Plesk' },
        { en: 'DNS & SSL', es: 'DNS y SSL' },
        { en: 'Linux & SSH', es: 'Linux y SSH' },
        { en: 'VPS', es: 'VPS' },
        { en: 'WordPress', es: 'WordPress' },
        { en: 'AI site builders', es: 'Constructores con IA' },
      ],
      whyLabel: { en: 'Why it matters:', es: 'Por qué importa:' },
      why: { en: 'hands-on with the whole life of a website: build, deploy, migrate and secure.', es: 'experiencia práctica con toda la vida de un sitio web: construir, desplegar, migrar y asegurar.' },
    },
    {
      n: '03',
      kind: 'goal',
      label: { en: 'CHECKPOINT 03 · NEXT', es: 'CHECKPOINT 03 · SIGUIENTE' },
      company: { en: 'Web dev company', es: 'Empresa de desarrollo' },
      when: { en: 'Goal', es: 'Meta' },
      aria: { en: 'Checkpoint 03, next goal: a web development company. Show details.', es: 'Checkpoint 03, siguiente meta: una empresa de desarrollo web. Ver detalles.' },
      context: { en: 'Next checkpoint', es: 'Siguiente checkpoint' },
      role: { en: 'Full-stack developer, with a foot in infrastructure', es: 'Desarrollador full-stack, con base en infraestructura' },
      lead: {
        en: 'The next step: building products with a development team, bringing what I already do every day with hosting, servers and websites.',
        es: 'El siguiente paso: construir productos con un equipo de desarrollo, aportando lo que ya hago cada día con hosting, servidores y sitios web.',
      },
      bullets: [
        { en: 'Ready to ship: front end, back end and the server it runs on.', es: 'Listo para entregar: front end, back end y el servidor donde corre.' },
        { en: 'Used to real customers, real incidents and real deadlines.', es: 'Acostumbrado a clientes reales, incidentes reales y plazos reales.' },
      ],
      tags: [],
      whyLabel: { en: 'Looking for:', es: 'Busco:' },
      why: { en: "a team where I can grow as a developer. Let's talk in Contact.", es: 'un equipo donde crecer como desarrollador. Hablemos en Contacto.' },
    },
  ] as Checkpoint[],
  // The goal coin's detail title (the board label is shorter)
  goalTitle: { en: 'A web development company', es: 'Una empresa de desarrollo web' },
}

// ---- About ----
export const ABOUT = {
  eyebrow: { en: 'About', es: 'Sobre mí' },
  title: { en: "Hi, I'm Santiago Boada.", es: 'Hola, soy Santiago Boada.' },
  badgeAria: { en: 'ID badge. Press to flip it.', es: 'Carnet. Presiona para darle la vuelta.' },
  name: 'Santiago Boada',
  role: { en: 'Self-taught web developer', es: 'Desarrollador web autodidacta' },
  rows: [
    { k: { en: 'Age', es: 'Edad' }, v: { en: '25', es: '25' } },
    { k: { en: 'Based in', es: 'Vivo en' }, v: { en: 'Bogotá, Colombia', es: 'Bogotá, Colombia' } },
    { k: { en: 'Day to day', es: 'Día a día' }, v: { en: 'Websites · VPS · DNS & SSL · Migrations', es: 'Sitios web · VPS · DNS y SSL · Migraciones' } },
    { k: { en: 'Looking for', es: 'Busco' }, v: { en: 'Full-stack or web developer role', es: 'Cargo de desarrollador full-stack o web' } },
  ] as { k: L; v: L }[],
  studying: { en: 'STUDYING', es: 'ESTUDIANDO' },
  study: { en: 'Full-Stack Development Master', es: 'Máster en Desarrollo Full-Stack' },
  school: { en: 'Conquer Blocks Academy · finishing', es: 'Conquer Blocks Academy · por terminar' },
  availableFor: { en: 'AVAILABLE FOR', es: 'DISPONIBLE PARA' },
  availability: { en: 'Remote or on-site', es: 'Remoto o presencial' },
  place: { en: 'Bogotá, Colombia', es: 'Bogotá, Colombia' },
  hintClick: { en: 'Click the badge to flip it', es: 'Haz clic en el carnet para darle la vuelta' },
  hintTap: { en: 'Tap the badge to flip it', es: 'Toca el carnet para darle la vuelta' },
}

// ---- Contact ----
export const CONTACT = {
  eyebrow: { en: 'Contact', es: 'Contacto' },
  status: { en: 'Open to work · Bogotá, remote or on-site', es: 'Disponible · Bogotá, remoto o presencial' },
  dear: { en: 'DEAR RECRUITER,', es: 'ESTIMADO RECLUTADOR,' },
  letterTitle: { en: "Let's talk.", es: 'Hablemos.' },
  text: { en: "Write me about a role or a project. I'll get back to you soon.", es: 'Escríbeme sobre un cargo o un proyecto. Te respondo pronto.' },
  copy: { en: 'Copy', es: 'Copiar' },
  copied: { en: 'Copied', es: 'Copiado' },
  copyFallback: { en: 'Press Ctrl+C', es: 'Presiona Ctrl+C' },
  title: { en: 'Contact', es: 'Contacto' },
}
