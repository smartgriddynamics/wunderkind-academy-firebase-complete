import { auth, db } from './firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, ArrowUpRight, ArrowRight, GraduationCap, BookOpen, Users,
  ShieldCheck, Microscope, Laptop, LibraryBig, Trees, Monitor, Palette,
  MapPin, Phone, Mail, Clock, CheckCircle2, ChevronDown, Lightbulb,
  HeartHandshake, Music, Trophy, Code2, Facebook, Instagram, Youtube,
  ClipboardList, Search, LogOut, Check, Ban, Eye, LayoutDashboard,
  UserRound, CalendarDays, FileText, AlertCircle, ExternalLink, Download
} from 'lucide-react'

const siteBase = import.meta.env.BASE_URL
const adminPath = `${siteBase}admin`
const applyPath = `${siteBase}apply`
const accountPath = `${siteBase}account`

function SchoolMark({ className = '' }) {
  return <img src={`${siteBase}wunderkindscho-logo.PNG`} alt="Wunderkind Academy logo" className={`shrink-0 object-contain ${className}`} />
}

// Place your own approved photos in public/images and update these paths.
// Example: hero: `${siteBase}images/students-learning.jpg`
const photos = {
  hero: `${siteBase}images/students-learning.jpg`,
  about: `${siteBase}images/classroom.jpg`,
  early: `${siteBase}images/early-years.jpg`,
  primary: `${siteBase}images/class7.jpg`,
  stem: `${siteBase}images/stem-lab.jpg`,
  arts: `${siteBase}images/arts-sports.jpg`,
  science: `${siteBase}images/stem-lab.jpg`,
  computer: `${siteBase}images/computer-lab.jpg`,
  library: `${siteBase}images/classroom.jpg`,
  playground: `${siteBase}images/school-building.jpg`,
  classroom: `${siteBase}images/classroom.jpg`,
  art: `${siteBase}images/art-music-room.jpg`,
  students: `${siteBase}images/students-learning.jpg`,
}

const navLinks = [
  ['About Us', '#about'], ['Academics', '#academics'], ['Facilities', '#facilities'],
  ['Student Life', '#student-life'], ['Admissions', applyPath], ['Applicant login', accountPath], ['Contact', '#contact'],
]

const programs = [
  { title: 'Early Years', age: 'AGES 3–5', text: 'Play-based learning that supports social, emotional, and cognitive development.', image: photos.early, icon: HeartHandshake },
  { title: 'Primary Education', age: 'GRADES 1–6', text: 'A comprehensive foundation in literacy, numeracy, critical thinking, and hands-on learning.', image: photos.primary, icon: BookOpen },
  { title: 'STEM & Innovation', age: 'DISCOVER & CREATE', text: 'Robotics, coding, science experiments, and activities that introduce future-ready skills.', image: photos.stem, icon: Lightbulb },
  { title: 'Arts & Sports', age: 'CREATE & PARTICIPATE', text: 'Creative arts and athletic opportunities that encourage teamwork and personal growth.', image: photos.arts, icon: Trophy },
]

const facilities = [
  { title: 'Science Laboratories', detail: 'Physics · Chemistry · Biology', image: photos.science, icon: Microscope },
  { title: 'Computer Laboratory', detail: '50+ workstations · Digital learning', image: photos.computer, icon: Laptop },
  { title: 'Library', detail: '10,000+ books · Digital resources', image: photos.library, icon: LibraryBig },
  { title: 'Playground', detail: 'Outdoor play and physical activity', image: photos.playground, icon: Trees },
  { title: 'Smart Classrooms', detail: 'Interactive whiteboards · Projectors', image: photos.classroom, icon: Monitor },
  { title: 'Art & Music Rooms', detail: 'Creative expression and practice', image: photos.art, icon: Palette },
]

const activities = [
  { title: 'Robotics Club', icon: Code2, text: 'Explore ideas through technology and practical projects.' },
  { title: 'Debate Team', icon: Users, text: 'Build confidence, communication, and critical thinking.' },
  { title: 'Art & Music', icon: Music, text: 'Make space for imagination, expression, and creativity.' },
  { title: 'Sports Teams', icon: Trophy, text: 'Practice teamwork, discipline, and active participation.' },
]

function useCollection(name, publishedOnly=false) {
  const [items, setItems] = useState([])
  const [loadError, setLoadError] = useState('')
  useEffect(() => onSnapshot(publishedOnly ? query(collection(db,name),where('published','==',true)) : collection(db,name), snapshot => {
    setItems(snapshot.docs.map(d => ({...d.data(), id:d.id})))
    setLoadError('')
  }, err => setLoadError(err.message)), [name,publishedOnly])
  return [items,loadError]
}
function makeId() {
  return `WA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}
async function ensureApplicantAccount(user) {
  const accountRef = doc(db, 'applicantAccounts', user.uid)
  const account = await getDoc(accountRef)
  if (account.exists()) return
  try {
    await setDoc(accountRef, {
      uid: user.uid,
      email: user.email || '',
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    const existingAccount = await getDoc(accountRef)
    if (!existingAccount.exists()) throw error
  }
}
function formatDate(value) {
  if (!value) return '—'
  return new Date(value?.toDate ? value.toDate() : value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
async function downloadApplicationPdf(application) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const left = 16
  const right = 194
  let y = 18
  const printable = value => String(value || '—')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
  const ensureSpace = height => {
    if (y + height > 280) {
      pdf.addPage()
      y = 18
    }
  }
  const heading = text => {
    ensureSpace(12)
    y += 4
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(24, 49, 83)
    pdf.text(text, left, y)
    y += 3
    pdf.setDrawColor(214, 168, 79)
    pdf.line(left, y, right, y)
    y += 5
  }
  const field = (label, value) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    const labelLines = pdf.splitTextToSize(`${label}:`, 48)
    pdf.setFont('helvetica', 'normal')
    const valueLines = pdf.splitTextToSize(printable(value), 126)
    const lineCount = Math.max(labelLines.length, valueLines.length)
    const lineHeight = 4.5
    ensureSpace(lineCount * lineHeight + 2)
    pdf.setTextColor(90, 100, 110)
    pdf.text(labelLines, left, y)
    pdf.setTextColor(35, 42, 50)
    pdf.text(valueLines, left + 50, y)
    y += lineCount * lineHeight + 2
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(24, 49, 83)
  pdf.text('Wunderkind Academy', left, y)
  y += 8
  pdf.setFontSize(13)
  pdf.text('Pupil Application', left, y)
  y += 7
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(90, 100, 110)
  pdf.text(`Reference: ${printable(application.id)}   Status: ${printable(application.status || 'Pending')}`, left, y)
  y += 5
  pdf.text(`Submitted: ${formatDate(application.submittedAt)}`, left, y)
  y += 2

  heading('Pupil particulars / Taarifa ya mwanafunzi')
  const pupilFields = [
    ['Form date', application.formDate],
    ['Full name', application.studentName],
    ['Nickname', application.nickname],
    ['Sex', application.gender],
    ['Date of birth', formatDate(application.dateOfBirth)],
    ['Nationality', application.nationality],
    ['Birth place', application.birthPlace],
    ['Home address', application.address],
    ['Stays with', application.staysWith],
    ['Birth certificate attached', application.birthCertificateAttached],
    ['Last school attended', application.previousSchool],
    ['Religion', application.religion],
    ['Allergies', application.allergies],
    ['Sickness from birth', application.congenitalIllness],
    ['Class requested', application.applyingFor],
    ['Other important information', application.otherChildInformation || application.notes],
  ]
  pupilFields.forEach(([label, value]) => field(label, value))

  heading('Mother / Mlezi 1')
  field('Full name', application.mother?.name || (application.guardianRelationship === 'Mother' ? application.guardianName : ''))
  field('Phone', application.mother?.phone || (application.guardianRelationship === 'Mother' ? application.guardianPhone : ''))
  field('Work', application.mother?.work)
  field('NIDA number', application.mother?.nida)

  heading('Father / Mlezi 2')
  field('Full name', application.father?.name || (application.guardianRelationship === 'Father' ? application.guardianName : ''))
  field('Phone', application.father?.phone || (application.guardianRelationship === 'Father' ? application.guardianPhone : ''))
  field('Work', application.father?.work)
  field('NIDA number', application.father?.nida)

  heading('Other contact / Mawasiliano ya mtu mwingine')
  const hasLegacyOtherContact = !application.mother && !application.father && !['Mother', 'Father'].includes(application.guardianRelationship)
  field('Full name', application.otherContact?.name || (hasLegacyOtherContact ? application.guardianName : ''))
  field('Phone', application.otherContact?.phone || (hasLegacyOtherContact ? application.guardianPhone : ''))
  field('Address', application.otherContact?.address || (hasLegacyOtherContact ? application.address : ''))
  field('NIDA number', application.otherContact?.nida)
  field('Email', application.guardianEmail)

  heading('Academic results')
  if (application.results?.length) {
    application.results.forEach(result => {
      field(`${result.subject} - ${result.assessment}`, `${result.score}${result.grade ? ` (Grade ${result.grade})` : ''}`)
      if (result.comment) field('Teacher comment', result.comment)
    })
  } else {
    field('Results', 'No results entered')
  }

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(130, 130, 130)
    pdf.text(`Wunderkind Academy - Confidential   |   Page ${page} of ${pageCount}`, left, 288)
  }

  const safeName = printable(application.studentName)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  pdf.save(`application-${safeName || 'student'}-${printable(application.id).replace(/[^a-zA-Z0-9-]/g, '')}.pdf`)
}
function StatusPill({ status }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    Approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    Rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.Pending}`}>{status || 'Pending'}</span>
}
function Reveal({ children, delay = 0, className = '' }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}
function SectionHeading({ eyebrow, title, text, centered = false }) {
  return <div className={`mb-12 ${centered ? 'text-center' : ''}`}><span className={`eyebrow ${centered ? 'justify-center' : ''}`}>{eyebrow}</span><h2 className="heading mt-4 text-4xl md:text-5xl text-academy-deep">{title}</h2>{text && <p className={`mt-5 max-w-2xl text-base md:text-lg leading-8 text-slate-600 ${centered ? 'mx-auto' : ''}`}>{text}</p>}</div>
}

function Navbar({ applyPage = false }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-sm backdrop-blur-xl' : 'bg-white/90 backdrop-blur-md'}`}>
    <div className="container-wide flex h-[82px] items-center justify-between gap-5">
      <a href={applyPage ? siteBase : '#home'} className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="Wunderkind Academy home"><SchoolMark className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]" /><span className="font-serif text-base font-semibold leading-tight text-academy-deep sm:text-lg">Wunderkind<br />Academy</span></a>
      <nav className="hidden items-center gap-6 xl:flex" aria-label="Main navigation">{navLinks.map(([label, href]) => <a key={href} href={applyPage && href.startsWith('#') ? `${siteBase}${href}` : href} className="text-[13px] font-medium text-slate-600 transition hover:text-amber-700">{label}</a>)}</nav>
      <div className="hidden xl:block"><a href={applyPath} className="inline-flex items-center gap-2 rounded-full bg-academy-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-academy-navy">Apply Now <ArrowUpRight size={16} /></a></div>
      <button className="rounded-lg p-2 text-academy-deep xl:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={25} /> : <Menu size={25} />}</button>
    </div>
    <AnimatePresence>{open && <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-slate-100 bg-white xl:hidden"><div className="container-wide flex flex-col py-3">{navLinks.map(([label, href]) => <a key={href} href={applyPage && href.startsWith('#') ? `${siteBase}${href}` : href} onClick={() => setOpen(false)} className="border-b border-slate-100 py-3 text-sm font-medium text-slate-700">{label}</a>)}<a href={applyPath} onClick={() => setOpen(false)} className="mt-4 rounded-full bg-academy-deep px-5 py-3 text-center text-sm font-semibold text-white">Apply Now <ArrowUpRight className="ml-1 inline" size={16} /></a><a href={adminPath} className="py-3 text-center text-xs text-slate-500">Staff / Admin portal</a></div></motion.nav>}</AnimatePresence>
  </header>
}

function Hero() {
  return <section id="home" className="relative flex min-h-[760px] items-center overflow-hidden bg-slate-100 pt-20 md:min-h-[850px]"><div className="absolute inset-0"><img src={photos.hero} alt="Students learning together in a classroom" className="h-full w-full object-cover object-center" onError={(e) => { e.currentTarget.style.display = 'none' }} /><div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/45 md:to-white/10" /><div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/10" /></div>
    <div className="container-wide relative z-10 grid items-center gap-10 py-20 md:grid-cols-[1.05fr_.95fr]"><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75 }}><span className="eyebrow">Learning with purpose</span><h1 className="heading mt-6 max-w-3xl text-5xl text-academy-deep sm:text-6xl lg:text-7xl">Nurturing Young Minds for a <span className="text-amber-700">Brighter Future.</span></h1><p className="mt-7 max-w-xl text-base leading-8 text-slate-700 md:text-lg">At Wunderkind Academy, we provide excellence in academics, creativity, and character development. Our holistic approach prepares students to thrive in an ever-changing world.</p>    <div className="mt-9 flex flex-wrap gap-3"><a href={applyPath} className="inline-flex items-center gap-3 rounded-full bg-academy-deep px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-academy-navy">Apply for Admission <ArrowRight size={17} /></a><a href="#about" className="inline-flex items-center gap-2 rounded-full border border-academy-deep/20 bg-white/70 px-6 py-4 text-sm font-semibold text-academy-deep transition hover:border-academy-gold hover:bg-white">Discover Our School</a></div><div className="mt-10 flex items-center gap-3 text-sm text-slate-600"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm"><GraduationCap size={19} /></span><span>Academics · Creativity · Character</span></div></motion.div>
      <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .15 }} className="relative hidden md:block"><div className="photo ml-auto h-[470px] w-[88%] rounded-[180px_180px_24px_24px] shadow-soft"><img src={photos.students} alt="Students collaborating on a classroom activity" onError={(e) => { e.currentTarget.style.display = 'none' }} /></div><div className="absolute -bottom-7 left-0 max-w-[245px] rounded-2xl bg-white p-5 shadow-soft"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Lightbulb size={20} /></div><p className="font-serif text-xl text-academy-deep">Curiosity starts here.</p><p className="mt-1 text-xs leading-5 text-slate-500">Helping every learner explore their potential.</p></div></motion.div>
    </div><a href="#about" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500 md:flex">Scroll to explore <ChevronDown size={16} className="animate-bounce" /></a></section>
}

function About() {
  return <section id="about" className="section-space overflow-hidden bg-white"><div className="container-wide grid items-center gap-14 lg:grid-cols-2"><Reveal><div className="photo relative h-[440px] rounded-[24px_120px_24px_24px] sm:h-[560px]"><img src={photos.about} alt="Teacher supporting students in a classroom" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} /><div className="absolute bottom-6 left-6 max-w-xs rounded-xl bg-white/95 p-5 shadow-soft"><p className="font-serif text-2xl text-academy-deep">Every child has potential.</p><p className="mt-1 text-sm text-slate-500">We help them discover it.</p></div></div></Reveal><Reveal delay={.12}><SectionHeading eyebrow="Who we are" title="Discover Wunderkind Academy" /><p className="leading-8 text-slate-600">Welcome to Wunderkind Academy, where we believe every child has unique potential waiting to be discovered. Founded on the principles of academic excellence, creativity, and character development, we create an environment where students can thrive both intellectually and personally.</p><div className="mt-8 space-y-6">{[{icon:GraduationCap,title:'Our Mission',text:'To provide a transformative educational experience that fosters intellectual curiosity, creativity, and ethical leadership in every student.'},{icon:Lightbulb,title:'Our Vision',text:'To be a leading educational institution that prepares innovative thinkers and compassionate leaders for a rapidly evolving global society.'},{icon:HeartHandshake,title:'Our Values',text:'Integrity, excellence, respect, collaboration, and innovation guide everything we do.'}].map((x)=>{const Icon=x.icon;return <div key={x.title} className="flex gap-4"><div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Icon size={21}/></div><div><h3 className="font-serif text-xl text-academy-deep">{x.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{x.text}</p></div></div>})}</div></Reveal></div></section>
}

function Academics() {
  return <section id="academics" className="section-space bg-academy-light"><div className="container-wide"><Reveal><SectionHeading eyebrow="Learning pathways" title="Learning Today. Leading Tomorrow." text="Discover learning opportunities designed to develop knowledge, creativity, confidence, and practical skills."/></Reveal><div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{programs.map((p,i)=>{const Icon=p.icon;return <Reveal key={p.title} delay={i*.08}><article className="group h-full overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft"><div className="photo relative h-56"><img src={p.image} alt={p.title} loading="lazy" onError={(e)=>{e.currentTarget.style.display='none'}}/><div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-academy-deep shadow-sm"><Icon size={20}/></div></div><div className="p-6"><span className="text-[10px] font-bold tracking-[.16em] text-amber-700">{p.age}</span><h3 className="heading mt-2 text-2xl text-academy-deep">{p.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{p.text}</p><a href="#contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-academy-navy transition group-hover:text-amber-700">Enquire about this program <ArrowRight size={15}/></a></div></article></Reveal>})}</div></div></section>
}

function WhyUs() {
  const items=[{icon:GraduationCap,title:'Qualified Teachers',text:'Experienced educators passionate about nurturing potential and supporting academic development.'},{icon:Monitor,title:'Modern Facilities',text:'Learning spaces, laboratories, and recreational facilities designed to support education.'},{icon:Users,title:'Small Class Sizes',text:'Personalized attention that encourages participation, questions, and confidence.',extra:'15:1 student–teacher ratio'},{icon:ShieldCheck,title:'Safe Environment',text:'A nurturing, inclusive, and secure campus designed to support student well-being.',extra:'24/7 security'}]
  return <section className="section-space bg-white"><div className="container-wide"><Reveal><SectionHeading eyebrow="The Wunderkind difference" title="A Place Where Every Child Can Thrive" text="We are committed to creating an environment where students are supported, challenged, and encouraged to reach their potential." centered/></Reveal><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{items.map((item,i)=>{const Icon=item.icon;return <Reveal key={item.title} delay={i*.07}><div className="h-full rounded-2xl border border-slate-100 bg-white p-7 text-center transition hover:border-amber-200 hover:shadow-soft"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Icon size={27} strokeWidth={1.7}/></div><h3 className="mt-5 font-serif text-xl text-academy-deep">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>{item.extra&&<p className="mt-4 text-xs font-bold text-amber-700">{item.extra}</p>}</div></Reveal>})}</div></div></section>
}

function Facilities() {
  return <section id="facilities" className="section-space bg-academy-light"><div className="container-wide"><Reveal><SectionHeading eyebrow="Our campus" title="Spaces That Inspire Discovery" text="Explore the facilities that support learning, creativity, experimentation, and student development."/></Reveal><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{facilities.map((f,i)=>{const Icon=f.icon;return <Reveal key={f.title} delay={i*.05}><article className="group overflow-hidden rounded-2xl bg-white"><div className="photo relative h-64"><img src={f.image} alt={f.title} loading="lazy" onError={(e)=>{e.currentTarget.style.display='none'}}/><div className="absolute inset-0 bg-gradient-to-t from-academy-deep/75 via-transparent to-transparent opacity-90"/><div className="absolute bottom-5 left-5 flex items-center gap-3 text-white"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur"><Icon size={19}/></span><h3 className="font-serif text-2xl">{f.title}</h3></div></div><div className="flex items-center justify-between gap-3 px-5 py-4"><p className="text-xs text-slate-500">{f.detail}</p><ArrowUpRight size={17} className="shrink-0 text-amber-700 transition group-hover:-translate-y-1 group-hover:translate-x-1"/></div></article></Reveal>})}</div></div></section>
}

function StudentLife() {
  return <section id="student-life" className="section-space bg-white"><div className="container-wide"><div className="grid items-center gap-12 lg:grid-cols-2"><Reveal><SectionHeading eyebrow="Life at Wunderkind" title="Beyond the Classroom" text="Education is more than lessons and examinations. Student activities create opportunities for collaboration, discovery, creativity, and personal growth."/><div className="grid gap-4 sm:grid-cols-2">{activities.map((a)=>{const Icon=a.icon;return <div key={a.title} className="rounded-xl border border-slate-100 p-4 transition hover:border-amber-200 hover:bg-amber-50/30"><Icon size={21} className="text-amber-700"/><h3 className="mt-3 font-semibold text-academy-deep">{a.title}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{a.text}</p></div>})}</div><a href="#contact" className="mt-7 inline-flex items-center gap-2 rounded-full bg-academy-deep px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-academy-navy">Discover Student Life <ArrowRight size={16}/></a></Reveal><Reveal delay={.12}><div className="photo relative h-[520px] rounded-[120px_24px_24px_24px]"><img src={photos.students} alt="Students taking part in a collaborative school activity" loading="lazy" onError={(e)=>{e.currentTarget.style.display='none'}}/><div className="absolute bottom-5 right-5 max-w-[240px] rounded-xl bg-white p-5 shadow-soft"><p className="font-serif text-xl text-academy-deep">Learn together.</p><p className="mt-1 text-sm leading-6 text-slate-500">Grow through shared experiences and new challenges.</p></div></div></Reveal></div></div></section>
}

function ApplicationForm({ user }) {
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')
  const [busy,setBusy] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const value = name => String(data.get(name) || '').trim()
    const mother = {
      name: value('motherName'),
      phone: value('motherPhone'),
      work: value('motherWork'),
      nida: value('motherNida'),
    }
    const father = {
      name: value('fatherName'),
      phone: value('fatherPhone'),
      work: value('fatherWork'),
      nida: value('fatherNida'),
    }
    const otherContact = {
      name: value('otherContactName'),
      phone: value('otherContactPhone'),
      address: value('otherContactAddress'),
      nida: value('otherContactNida'),
    }
    const guardianName = mother.name || father.name || otherContact.name
    const guardianPhone = mother.phone || father.phone || otherContact.phone
    if (!guardianPhone) {
      setError('Please provide a phone number for the mother, father, or another contact.')
      return
    }
    const studentName = value('studentName')
    const application = {
      id: makeId(),
      ownerUid: user.uid,
      accountEmail: user.email || '',
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      studentName,
      formDate: value('formDate'),
      nickname: value('nickname'),
      dateOfBirth: value('dateOfBirth'),
      gender: value('gender'),
      nationality: value('nationality'),
      birthPlace: value('birthPlace'),
      address: value('childAddress'),
      staysWith: value('staysWith'),
      birthCertificateAttached: value('birthCertificateAttached'),
      previousSchool: value('previousSchool'),
      religion: value('religion'),
      allergies: value('allergies'),
      congenitalIllness: value('congenitalIllness'),
      otherChildInformation: value('otherChildInformation'),
      applyingFor: value('applyingFor'),
      mother,
      father,
      otherContact,
      guardianName,
      guardianRelationship: mother.name ? 'Mother' : father.name ? 'Father' : 'Other contact',
      guardianPhone,
      guardianEmail: value('guardianEmail').toLowerCase(),
    }
    setBusy(true)
    try {
      const result = await addDoc(collection(db,'applications'), {...application, submittedAt:serverTimestamp()})
      setSubmitted({...application,id:result.id})
    } catch(err) { setError(`Unable to submit application: ${err.message}`); setBusy(false); return }
    setBusy(false)
    form.reset()
  }
  return <section id="admissions" className="section-space relative overflow-hidden bg-academy-deep pt-32 text-white"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-academy-gold/20"/><div className="container-wide relative"><Reveal><div className="max-w-2xl"><span className="eyebrow !text-academy-gold">Admissions</span><h1 className="heading mt-4 text-4xl md:text-5xl">Your Child’s Journey Starts Here</h1><p className="mt-5 text-base leading-8 text-white/70 md:text-lg">Complete the application form below. Your application will be recorded as pending until the school admissions team reviews it.</p></div></Reveal>
    <div className="mt-12 grid gap-7 md:grid-cols-4">{[['01','Inquiry','Learn about the school and the program.'],['02','Application','Provide student and parent/guardian details.'],['03','Assessment','The school may contact your family about assessment.'],['04','Decision','The admissions team reviews and updates your application.']].map(([n,t,d],i)=><Reveal key={n} delay={i*.08}><div className="relative h-full border-t border-white/20 pt-5"><span className="font-serif text-4xl text-academy-gold/90">{n}</span><h3 className="mt-4 font-serif text-2xl">{t}</h3><p className="mt-3 text-sm leading-7 text-white/65">{d}</p></div></Reveal>)}</div>
    <div className="mt-14 grid gap-10 rounded-3xl bg-white p-6 text-academy-deep shadow-soft md:p-10 lg:grid-cols-[.72fr_1.28fr]">
      <div><span className="eyebrow">Student application</span><h3 className="heading mt-4 text-3xl md:text-4xl">Apply to Wunderkind Academy</h3><p className="mt-4 leading-7 text-slate-600">Complete the pupil and parent particulars below in English or Kiswahili. Fields marked * are required. Keep your reference number after submitting.</p><div className="mt-8 rounded-xl bg-academy-light p-4 text-sm leading-6 text-slate-600"><ClipboardList size={20} className="mb-2 text-amber-700"/>Applications are submitted securely to the school admissions team.</div>{submitted&&<div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 size={20}/> Application submitted</div><p className="mt-2 text-sm leading-6 text-emerald-900">Reference: <strong>{submitted.id}</strong><br/>Student: {submitted.studentName}<br/>Status: Pending review</p><button type="button" onClick={()=>setSubmitted(null)} className="mt-3 text-sm font-semibold text-emerald-800 underline">Submit another application</button></div>}</div>
      <form onSubmit={handleSubmit} className="grid content-start gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700">Particulars of the pupil / Taarifa ya mwanafunzi</p><div className="gold-line"/></div>
        <div className="sm:col-span-2"><p className="text-sm font-bold text-academy-deep">1. All about a child / Kuhusu mtoto</p></div>
        <label className="text-xs font-semibold text-slate-700">Tarehe ya kujaza fomu hii / Date to fill in this form *<input required name="formDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Jina kamili ya mtoto / Full name of child *<input required name="studentName" className="form-field mt-2" autoComplete="name" placeholder="Child’s full legal name"/></label>
        <label className="text-xs font-semibold text-slate-700">Jina la nyumbani / Nickname<input name="nickname" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Jinsia / Sex *<select required name="gender" defaultValue="" className="form-field mt-2"><option value="" disabled>Select / Chagua</option><option>Female / Mwanamke</option><option>Male / Mwanaume</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Tarehe ya kuzaliwa / Date of birth *<input required name="dateOfBirth" type="date" max={new Date().toISOString().slice(0,10)} className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Uraia / Nationality<input name="nationality" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Sehemu alipozaliwa / Birth place<input name="birthPlace" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Sehemu anapoishi mtoto / Child’s home address (country, city, state, street, house number)<textarea name="childAddress" rows="2" className="form-field mt-2 resize-y"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Mtoto anaishi na nani? / Child stays with whom?<input name="staysWith" className="form-field mt-2"/></label>
        <fieldset className="sm:col-span-2"><legend className="text-xs font-semibold text-slate-700">Naunganisha cheti cha kuzaliwa? / Birth certificate copy attached?</legend><div className="mt-2 flex gap-6">{['Yes / Ndiyo','No / Hapana'].map(option=><label key={option} className="flex items-center gap-2 text-sm text-slate-700"><input required type="radio" name="birthCertificateAttached" value={option.startsWith('Yes')?'Yes':'No'}/>{option}</label>)}</div></fieldset>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Shule ya mwisho aliposoma / Last school attended<input name="previousSchool" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Dhehebu la mtoto / Religion of child<input name="religion" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Aleji ya kitu chochote / Any allergies<input name="allergies" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Ugonjwa wa kuzaliwa nao / Sickness from birth<input name="congenitalIllness" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Taarifa nyingine muhimu kuhusu mtoto / Other important information about the child<textarea name="otherChildInformation" rows="3" className="form-field mt-2 resize-y"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Unaomba nafasi ya kusoma mtoto wa darasa gani? / Which class are you applying for? *<select required name="applyingFor" defaultValue="" className="form-field mt-2"><option value="" disabled>Select a class / Chagua darasa</option>{['Early Years','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'].map(grade=><option key={grade}>{grade}</option>)}</select></label>
        <div className="mt-2 sm:col-span-2"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700">All about parents / Taarifa za wazazi</p><div className="gold-line"/></div>
        <div className="sm:col-span-2"><p className="text-sm font-bold text-academy-deep">1. Mlezi 1 - Jina la mama / Mother’s details</p></div>
        <label className="text-xs font-semibold text-slate-700">Jina la mama / Mother’s full name<input name="motherName" autoComplete="off" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Namba ya simu / Mother’s phone<input name="motherPhone" type="tel" autoComplete="tel" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Kazi / Mother’s work<input name="motherWork" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">NIDA – number / Mother’s NIDA number<input name="motherNida" className="form-field mt-2"/></label>
        <div className="mt-2 sm:col-span-2"><p className="text-sm font-bold text-academy-deep">2. Mlezi 2 - Jina la baba / Father’s details</p></div>
        <label className="text-xs font-semibold text-slate-700">Jina la baba / Father’s full name<input name="fatherName" autoComplete="off" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Namba ya simu / Father’s phone<input name="fatherPhone" type="tel" autoComplete="tel" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Kazi / Father’s work<input name="fatherWork" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">NIDA – number / Father’s NIDA number<input name="fatherNida" className="form-field mt-2"/></label>
        <div className="mt-2 sm:col-span-2"><p className="text-sm font-bold text-academy-deep">3. Mawasiliano ya mtu mwingine wa karibu / Another person for contact</p></div>
        <label className="text-xs font-semibold text-slate-700">Jina / Full name<input name="otherContactName" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Namba ya simu / Phone number<input name="otherContactPhone" type="tel" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Anapoishi / Address<input name="otherContactAddress" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">NIDA – number / NIDA number<input name="otherContactNida" className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Email address / Barua pepe<input name="guardianEmail" type="email" autoComplete="email" defaultValue={user.email || ''} className="form-field mt-2"/></label>
        {error&&<p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="sm:col-span-2"><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-academy-deep px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-academy-navy disabled:cursor-not-allowed disabled:opacity-60">{busy?'Submitting…':'Submit Application'} <ArrowRight size={16}/></button><p className="mt-3 text-xs leading-5 text-slate-500">Provide at least one phone number for a parent or another contact. Applications are securely stored; keep your reference number.</p></div>
      </form>
    </div></div></section>
}

function ApplicantApplications({ user }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setLoading(true)
    return onSnapshot(
      query(collection(db, 'applications'), where('ownerUid', '==', user.uid)),
      snapshot => {
        setApplications(snapshot.docs.map(item => ({ ...item.data(), id: item.id })))
        setError('')
        setLoading(false)
      },
      loadError => {
        setError(`Unable to load your applications: ${loadError.message}`)
        setLoading(false)
      },
    )
  }, [user.uid])
  const sortedApplications = applications.slice().sort((a, b) => {
    const time = value => value?.toDate ? value.toDate().getTime() : new Date(value || 0).getTime()
    return time(b.submittedAt) - time(a.submittedAt)
  })
  return <section className="rounded-3xl bg-white p-6 text-academy-deep shadow-soft md:p-9">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="eyebrow">Applicant account</span><h2 className="heading mt-3 text-3xl">My applications</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your application status and submitted pupil details are shown here.</p></div><span className="rounded-full bg-academy-light px-3 py-2 text-xs font-semibold text-slate-700">{user.email}</span></div>
    {loading&&<p className="mt-6 text-sm text-slate-500">Loading your applications…</p>}
    {error&&<p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {!loading&&!error&&sortedApplications.length===0&&<div className="mt-6 rounded-xl bg-academy-light p-5 text-sm leading-6 text-slate-600">You have not submitted an application yet. Submit the form below to see its review status here.</div>}
    <div className="mt-6 space-y-5">{sortedApplications.map(application=><article key={application.id} className="rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-slate-500">Application reference</p><p className="mt-1 font-semibold text-academy-deep">{application.id}</p><p className="mt-1 text-xs text-slate-500">Submitted {formatDate(application.submittedAt)}</p></div><StatusPill status={application.status}/></div>
      <div className={`mt-4 rounded-xl p-4 text-sm leading-6 ${application.status==='Approved'?'bg-emerald-50 text-emerald-900':application.status==='Rejected'?'bg-rose-50 text-rose-900':'bg-amber-50 text-amber-900'}`}>
        {application.status==='Approved'?'Your application has been approved.':application.status==='Rejected'?'Your application was not approved. Please contact the school for more information.':'Your application is awaiting review by the admissions team.'}
      </div>
      <h3 className="mt-5 text-sm font-bold text-academy-deep">Pupil details</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {[
          ['Full name',application.studentName],['Class requested',application.applyingFor],['Date of birth',formatDate(application.dateOfBirth)],
          ['Nickname',application.nickname],['Sex',application.gender],['Nationality',application.nationality],['Birth place',application.birthPlace],
          ['Home address',application.address],['Lives with',application.staysWith],['Birth certificate attached',application.birthCertificateAttached],
          ['Last school attended',application.previousSchool],['Religion',application.religion],['Allergies',application.allergies],
          ['Sickness from birth',application.congenitalIllness],['Other information',application.otherChildInformation || application.notes],
        ].map(([label,value])=><div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value||'—'}</dd></div>)}
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ['Mother',application.mother],
          ['Father',application.father],
          ['Other contact',application.otherContact],
        ].map(([label,contact])=><div key={label} className="rounded-lg border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-600">{label}</p><p className="mt-2 text-sm text-slate-800">{contact?.name||'—'}</p><p className="mt-1 text-xs text-slate-500">{contact?.phone||'—'}</p></div>)}
      </div>
      {application.status==='Approved'&&<section className="mt-6 rounded-xl border border-emerald-100 p-4">
        <h3 className="text-sm font-bold text-academy-deep">Academic results</h3>
        {application.results?.length?<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[460px] text-left text-sm"><thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="py-2 pr-3 font-semibold">Subject</th><th className="py-2 pr-3 font-semibold">Assessment</th><th className="py-2 pr-3 font-semibold">Score / result</th><th className="py-2 pr-3 font-semibold">Grade</th><th className="py-2 font-semibold">Teacher comment</th></tr></thead><tbody className="divide-y divide-slate-100">{application.results.map(result=><tr key={result.id}><td className="py-3 pr-3 font-medium text-slate-800">{result.subject}</td><td className="py-3 pr-3 text-slate-600">{result.assessment}</td><td className="py-3 pr-3 text-slate-600">{result.score}</td><td className="py-3 pr-3 text-slate-600">{result.grade||'—'}</td><td className="py-3 whitespace-pre-wrap text-slate-600">{result.comment||'—'}</td></tr>)}</tbody></table></div>:<p className="mt-2 text-sm text-slate-500">No academic results have been published yet.</p>}
      </section>}
    </article>)}</div>
  </section>
}

function ApplicantPortal({ showApplicationForm = false }) {
  const [user, setUser] = useState(null)
  const [activeSection, setActiveSection] = useState(showApplicationForm ? 'new-application' : 'overview')
  const [authLoading, setAuthLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (active) {
        setUser(currentUser)
        setAuthLoading(true)
        setProfileError('')
      }
      if (currentUser) {
        try {
          await ensureApplicantAccount(currentUser)
        } catch (profileIssue) {
          if (active) setProfileError(`Unable to prepare your applicant account: ${profileIssue.message}`)
        }
      }
      if (active) setAuthLoading(false)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  async function submitCredentials(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (registering && password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setBusy(true)
    try {
      if (registering) {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        await ensureApplicantAccount(credential.user)
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password)
      }
    } catch (authError) {
      setError(authError.message)
    } finally {
      setBusy(false)
    }
  }
  async function resetPassword() {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter your email address first, then request a password reset.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase())
      setNotice('Password reset instructions have been sent if an account exists for that email.')
    } catch (resetError) {
      setError(resetError.message)
    }
  }
  async function retryAccountSetup() {
    if (!user) return
    setProfileError('')
    try {
      await ensureApplicantAccount(user)
    } catch (setupError) {
      setProfileError(`Unable to prepare your applicant account: ${setupError.message}`)
    }
  }
  async function logout() {
    try {
      await signOut(auth)
    } catch (signOutError) {
      setError(`Unable to sign out: ${signOutError.message}`)
    }
  }
  return <main className="min-h-screen overflow-x-hidden bg-academy-light px-3 pb-16 pt-24 sm:px-4 sm:pt-28">
    <div className="container-wide min-w-0">
      {authLoading?<div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center text-slate-600 shadow-soft">Checking your account…</div>:!user?<div className="mx-auto max-w-xl rounded-3xl bg-white p-7 shadow-soft sm:p-10">
        <span className="eyebrow">Wunderkind Academy admissions</span>
        <h1 className="heading mt-4 text-3xl text-academy-deep">{registering?'Create your applicant account':'Applicant sign in'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{registering?'Create an account before completing an application. Use the same account later to check its status.':'Sign in to submit an application or check your child’s application status.'}</p>
        <form onSubmit={submitCredentials} className="mt-7 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">Email address<input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="form-field mt-2" placeholder="you@example.com"/></label>
          <label className="block text-xs font-semibold text-slate-700">Password<input required type="password" minLength={6} autoComplete={registering?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} className="form-field mt-2" placeholder="At least 6 characters"/></label>
          {registering&&<label className="block text-xs font-semibold text-slate-700">Confirm password<input required type="password" minLength={6} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} className="form-field mt-2" placeholder="Enter the password again"/></label>}
          {error&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {notice&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-academy-deep px-5 py-3.5 text-sm font-semibold text-white hover:bg-academy-navy disabled:opacity-60">{busy?'Please wait…':registering?'Create account':'Sign in'} <ArrowRight size={16}/></button>
        </form>
        {!registering&&<button type="button" onClick={resetPassword} className="mt-4 text-sm font-semibold text-amber-800 underline">Forgot password?</button>}
        <p className="mt-6 text-center text-sm text-slate-600">{registering?'Already have an account?':'New to Wunderkind Academy?'} <button type="button" onClick={()=>{setRegistering(!registering);setError('');setNotice('')}} className="font-semibold text-academy-deep underline">{registering?'Sign in':'Create an account'}</button></p>
      </div>:<div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 rounded-2xl bg-academy-deep p-3 text-white shadow-soft sm:p-4 lg:sticky lg:top-24">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/50">Applicant portal</p>
          <nav className="grid grid-cols-2 gap-2 lg:mt-2 lg:flex lg:flex-col" aria-label="Applicant dashboard sections">
            {[
              ['overview','Dashboard',LayoutDashboard],
              ['applications','My applications',ClipboardList],
              ['new-application','New application',FileText],
              ['profile','Account',UserRound],
            ].map(([key,label,Icon])=><button key={key} type="button" onClick={()=>setActiveSection(key)} aria-current={activeSection===key?'page':undefined} className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-3 text-left text-xs font-medium leading-4 transition sm:gap-3 sm:px-3 sm:text-sm lg:w-full ${activeSection===key?'bg-white text-academy-deep':'text-white/75 hover:bg-white/10 hover:text-white'}`}><Icon className="shrink-0" size={18}/><span className="min-w-0">{label}</span></button>)}
          </nav>
          <div className="mt-5 hidden border-t border-white/10 pt-4 lg:block"><p className="truncate px-3 text-xs text-white/55">{user.email}</p><button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"><LogOut size={18}/> Sign out</button></div>
        </aside>
        <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Applicant portal</p><h1 className="mt-1 break-words font-serif text-xl text-academy-deep sm:text-2xl">{activeSection==='overview'?'Welcome back':activeSection==='applications'?'My applications':activeSection==='new-application'?'New application':'Account settings'}</h1></div><button type="button" onClick={logout} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden sm:px-4 sm:py-2.5 sm:text-sm"><LogOut size={16}/> Sign out</button></header>
        {profileError&&<div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{profileError}<button type="button" onClick={retryAccountSetup} className="ml-3 font-semibold underline">Retry</button></div>}
        {activeSection==='overview'&&<section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8"><span className="eyebrow">Your school journey</span><h2 className="heading mt-3 text-3xl text-academy-deep">Manage your child’s application</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Submit an application, follow its review status, and see academic results once they are published after approval.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button type="button" onClick={()=>setActiveSection('applications')} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-amber-300 hover:bg-amber-50/40"><ClipboardList className="text-amber-700" size={22}/><h3 className="mt-3 font-semibold text-academy-deep">View applications</h3><p className="mt-1 text-sm text-slate-500">Check admission decisions and submitted information.</p></button><button type="button" onClick={()=>setActiveSection('new-application')} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-amber-300 hover:bg-amber-50/40"><FileText className="text-amber-700" size={22}/><h3 className="mt-3 font-semibold text-academy-deep">Start an application</h3><p className="mt-1 text-sm text-slate-500">Apply for a place at Wunderkind Academy.</p></button></div></section>}
        {activeSection==='applications'&&<ApplicantApplications user={user}/>}
        {activeSection==='new-application'&&!profileError&&<ApplicationForm key={user.uid} user={user}/>}
        {activeSection==='profile'&&<section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8"><span className="eyebrow">Account settings</span><h2 className="heading mt-3 text-3xl text-academy-deep">Your account</h2><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Sign-in email</p><p className="mt-1 break-all text-sm font-semibold text-academy-deep">{user.email}</p></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={resetPassword} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Send password reset email</button><button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-full bg-academy-deep px-4 py-2.5 text-sm font-semibold text-white hover:bg-academy-navy"><LogOut size={16}/> Sign out</button></div>{notice&&<p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error&&<p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}</section>}
        </div>
      </div>}
    </div>
  </main>
}

function AdmissionsIntro() {
  return <section id="admissions" className="section-space bg-academy-deep text-white"><div className="container-wide grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><span className="eyebrow !text-academy-gold">Admissions</span><h2 className="heading mt-4 text-4xl md:text-5xl">Your Child’s Journey Starts Here</h2><p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">Learn about joining Wunderkind Academy and submit an application for your child.</p></div><a href={applyPath} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-academy-deep transition hover:bg-academy-light">Start an application <ArrowRight size={17}/></a></div></section>
}

function Contact() {
  const [sent,setSent]=useState(false)
  return <section id="contact" className="section-space bg-academy-light"><div className="container-wide"><Reveal><SectionHeading eyebrow="Get in touch" title="We’d Love to Hear From You" text="Have questions about admissions, academic programs, or school life? Get in touch with Wunderkind Academy."/></Reveal><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><Reveal><div className="rounded-2xl bg-white p-7 shadow-sm md:p-9"><h3 className="font-serif text-2xl text-academy-deep">Contact information</h3><p className="mt-3 text-sm leading-7 text-slate-600">Our team is available during school office hours to help with your questions.</p><div className="mt-7 space-y-6"><a href="https://maps.google.com/?q=Kishiri+Mwanza+Tanzania" target="_blank" rel="noreferrer" className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><MapPin size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Visit us</span><span className="mt-1 block text-sm text-slate-500">Kishiri, Mwanza, Tanzania</span></span></a><a href="tel:+255749281607" className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Phone size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Call us</span><span className="mt-1 block text-sm text-slate-500">+255 749 281 607</span></span></a><a href="mailto:director@wunderkindacademyschool.org" className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Mail size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Email us</span><span className="mt-1 block break-all text-sm text-slate-500">director@wunderkindacademyschool.org</span></span></a><div className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Clock size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Office hours</span><span className="mt-1 block text-sm text-slate-500">Monday–Friday, 8:00 AM–5:00 PM</span></span></div></div></div></Reveal>
    <Reveal delay={.1}><form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);try{await addDoc(collection(db,'messages'),{name:data.get('name'),email:data.get('email'),subject:data.get('subject'),message:data.get('message'),createdAt:serverTimestamp()});setSent(true);form.reset()}catch(err){alert('Message not sent: '+err.message)}}} className="rounded-2xl bg-white p-7 shadow-sm md:p-9"><h3 className="font-serif text-2xl text-academy-deep">Send us a message</h3><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Full name *<input required className="form-field mt-2" name="name" placeholder="Your full name"/></label><label className="text-xs font-semibold text-slate-700">Email address *<input required type="email" className="form-field mt-2" name="email" placeholder="you@example.com"/></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Subject *<input required className="form-field mt-2" name="subject" placeholder="What would you like to ask?"/></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Message *<textarea required rows="5" className="form-field mt-2 resize-y" name="message" placeholder="Write your message here..."/></label></div><button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-full bg-academy-deep px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-academy-navy">Send Message <ArrowRight size={16}/></button>{sent&&<p role="status" className="mt-3 text-sm text-amber-800">Your message has been received by the school.</p>}</form></Reveal></div></div></section>
}

function Footer({ applyPage = false }) {
  const homeLink = applyPage ? siteBase : '#home'
  const sectionLink = href => applyPage ? `${siteBase}${href}` : href
  return <footer className="bg-[#0B1C2E] text-white"><div className="container-wide grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4"><div><a href={homeLink} aria-label="Wunderkind Academy home" className="inline-flex items-center"><SchoolMark className="h-16 w-16 object-contain" /></a><p className="mt-5 max-w-xs text-sm leading-7 text-white/60">Nurturing young minds through academic excellence, creativity, and character development since 2005.</p><div className="mt-5 flex gap-3"><a aria-label="Facebook" href={sectionLink('#contact')} className="rounded-full border border-white/15 p-2.5 text-white/70 hover:text-academy-gold"><Facebook size={17}/></a><a aria-label="Instagram" href={sectionLink('#contact')} className="rounded-full border border-white/15 p-2.5 text-white/70 hover:text-academy-gold"><Instagram size={17}/></a><a aria-label="YouTube" href={sectionLink('#contact')} className="rounded-full border border-white/15 p-2.5 text-white/70 hover:text-academy-gold"><Youtube size={17}/></a></div></div><div><h3 className="text-sm font-semibold">Explore</h3><ul className="mt-5 space-y-3 text-sm text-white/60">{[['About Us','#about'],['Academic Programs','#academics'],['Our Facilities','#facilities'],['Student Life','#student-life']].map(([t,h])=><li key={h}><a className="hover:text-academy-gold" href={sectionLink(h)}>{t}</a></li>)}</ul></div><div><h3 className="text-sm font-semibold">Admissions</h3><ul className="mt-5 space-y-3 text-sm text-white/60"><li><a className="hover:text-academy-gold" href={applyPath}>Admissions Process</a></li><li><a className="hover:text-academy-gold" href={applyPath}>Apply for Admission</a></li><li><a className="hover:text-academy-gold" href={adminPath}>Staff / Admin Portal</a></li></ul></div><div><h3 className="text-sm font-semibold">Contact</h3><ul className="mt-5 space-y-4 text-sm text-white/60"><li className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-academy-gold"/>Kishiri, Mwanza, Tanzania</li><li className="flex gap-3"><Phone size={17} className="shrink-0 text-academy-gold"/><a href="tel:+255749281607" className="hover:text-white">+255 749 281 607</a></li><li className="flex gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-academy-gold"/><a href="mailto:director@wunderkindacademyschool.org" className="break-all hover:text-white">director@wunderkindacademyschool.org</a></li><li className="flex gap-3"><Clock size={17} className="shrink-0 text-academy-gold"/>Mon–Fri: 8:00 AM–5:00 PM</li></ul></div></div><div className="border-t border-white/10"><div className="container-wide flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Wunderkind Academy. All rights reserved.</p><a href={homeLink} className="hover:text-academy-gold">Back to top ↑</a></div></div></footer>
}

function AdminLogin() {
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  async function submit(e) {
    e.preventDefault();setError('');setBusy(true)
    try { await signInWithEmailAndPassword(auth,username,password) }
    catch(err) {setError('Sign in failed. Check your email, password, and administrator permissions.')}
    finally {setBusy(false)}
  }
  return <div className="min-h-screen bg-academy-light px-4 py-12"><div className="mx-auto max-w-md"><a href={siteBase} className="mb-8 inline-flex items-center gap-3"><SchoolMark className="h-20 w-20 object-contain" /><span><span className="block font-serif text-xl text-academy-deep">Wunderkind Academy</span><span className="text-xs text-slate-500">Admissions administration</span></span></a><div className="rounded-3xl bg-white p-8 shadow-soft sm:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><ShieldCheck size={28}/></div><h1 className="heading mt-5 text-3xl text-academy-deep">Admin sign in</h1><p className="mt-3 text-sm leading-6 text-slate-600">Sign in using your authorized school administrator account.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-xs font-semibold text-slate-700">Email<input type="email" required value={username} onChange={e=>setUsername(e.target.value)} className="form-field mt-2" autoComplete="username" placeholder="admin@school.org"/></label><label className="block text-xs font-semibold text-slate-700">Password<input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="form-field mt-2" autoComplete="current-password" placeholder="Password"/></label>{error&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<button className="flex w-full items-center justify-center gap-2 rounded-full bg-academy-deep px-5 py-3.5 text-sm font-semibold text-white hover:bg-academy-navy">Sign in <ArrowRight size={16}/></button></form><a href={siteBase} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-academy-deep"><ArrowRight className="rotate-180" size={15}/> Return to school website</a></div></div></div>
}

function ApplicationResultsEditor({ application }) {
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const results = Array.isArray(application.results) ? application.results : []

  async function saveResult(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const result = {
      id: editing?.id || makeId(),
      subject: String(form.get('subject') || '').trim(),
      assessment: String(form.get('assessment') || '').trim(),
      score: String(form.get('score') || '').trim(),
      grade: String(form.get('grade') || '').trim(),
      comment: String(form.get('comment') || '').trim(),
      recordedAt: editing?.recordedAt || new Date().toISOString(),
    }
    try {
      const nextResults = editing
        ? results.map(item => item.id === editing.id ? result : item)
        : [...results, result]
      await updateDoc(doc(db, 'applications', application.id), { results: nextResults })
      setEditing(null)
      setNotice(editing ? 'Result updated.' : 'Result added.')
    } catch (saveError) {
      setError(`Unable to save result: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function removeResult(resultId) {
    if (!window.confirm('Delete this result permanently?')) return
    setError('')
    setNotice('')
    try {
      await updateDoc(doc(db, 'applications', application.id), {
        results: results.filter(item => item.id !== resultId),
      })
      if (editing?.id === resultId) setEditing(null)
      setNotice('Result deleted.')
    } catch (deleteError) {
      setError(`Unable to delete result: ${deleteError.message}`)
    }
  }

  return <section className="rounded-2xl border border-slate-200 p-5">
    <h3 className="text-sm font-bold text-academy-deep">Academic results</h3>
    <p className="mt-1 text-xs leading-5 text-slate-500">Results are visible to the family only after this application is approved.</p>
    {results.length>0?<div className="mt-4 divide-y divide-slate-100">{results.map(result=><div key={result.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-academy-deep">{result.subject} · {result.assessment}</p><p className="mt-1 text-sm text-slate-700">Score: {result.score||'—'}{result.grade?` · Grade: ${result.grade}`:''}</p>{result.comment&&<p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{result.comment}</p>}</div><div className="flex gap-3"><button type="button" onClick={()=>setEditing(result)} className="text-xs font-semibold text-blue-700">Edit</button><button type="button" onClick={()=>removeResult(result.id)} className="text-xs font-semibold text-rose-700">Delete</button></div></div>)}</div>:<p className="mt-3 text-sm text-slate-500">No results have been entered yet.</p>}
    <form key={editing?.id||'new'} onSubmit={saveResult} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-slate-700">Subject<input required name="subject" defaultValue={editing?.subject||''} className="form-field mt-2"/></label>
      <label className="text-xs font-semibold text-slate-700">Exam / term<input required name="assessment" defaultValue={editing?.assessment||''} className="form-field mt-2" placeholder="e.g. Term 1 exam 2026"/></label>
      <label className="text-xs font-semibold text-slate-700">Score / result<input required name="score" defaultValue={editing?.score||''} className="form-field mt-2"/></label>
      <label className="text-xs font-semibold text-slate-700">Grade (optional)<input name="grade" defaultValue={editing?.grade||''} className="form-field mt-2"/></label>
      <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Teacher comment (optional)<textarea name="comment" rows="2" defaultValue={editing?.comment||''} className="form-field mt-2 resize-y"/></label>
      {error&&<p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice&&<p role="status" className="sm:col-span-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="submit" disabled={saving} className="rounded-full bg-academy-deep px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving?'Saving…':editing?'Save result':'Add result'}</button>{editing&&<button type="button" onClick={()=>setEditing(null)} className="text-xs font-semibold text-slate-600 underline">Cancel</button>}</div>
    </form>
  </section>
}

function AdminDashboard({ onLogout }) {
  const [applications,applicationsError] = useCollection('applications')
  const [applicantAccounts,applicantAccountsError] = useCollection('applicantAccounts')
  const [activeSection,setActiveSection] = useState('overview')
  const [filter,setFilter] = useState('All')
  const [search,setSearch] = useState('')
  const [selected,setSelected] = useState(null)
  const [notice,setNotice] = useState('')
  const refresh = () => setNotice('Data synchronizes automatically with Firestore.')
  const counts = useMemo(() => ({
    All: applications.length,
    Pending: applications.filter(a=>a.status==='Pending').length,
    Approved: applications.filter(a=>a.status==='Approved').length,
    Rejected: applications.filter(a=>a.status==='Rejected').length,
  }), [applications])
  const filtered = useMemo(() => applications.filter(a => (filter==='All'||a.status===filter) && [a.studentName,a.guardianName,a.guardianEmail,a.accountEmail,a.id,a.applyingFor,a.mother?.name,a.mother?.phone,a.father?.name,a.father?.phone,a.otherContact?.name,a.otherContact?.phone].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))), [applications,filter,search])
  async function changeStatus(id,status) {
    try {
      await updateDoc(doc(db,'applications',id),{status,reviewedAt:serverTimestamp()})
      setNotice(`Application ${id} marked ${status.toLowerCase()}.`)
    } catch(err) {setNotice(`Update failed: ${err.message}`)}
  }
  async function removeApplication(id) {
    if(!window.confirm('Permanently delete this application?')) return
    try {await deleteDoc(doc(db,'applications',id));setSelected(null);setNotice('Application deleted.')}
    catch(err){setNotice(`Delete failed: ${err.message}`)}
  }
  const current = selected ? applications.find(a=>a.id===selected.id) || selected : null
  const accountsWithParents = applicantAccounts.map(account => {
    const linkedApplications = applications.filter(application => application.ownerUid === account.id)
    const parents = [...new Set(linkedApplications.map(application =>
      application.guardianName ||
      application.mother?.name ||
      application.father?.name ||
      application.otherContact?.name
    ).filter(Boolean))]
    return { ...account, linkedApplications, parents }
  }).sort((a,b)=>String(a.email||'').localeCompare(String(b.email||'')))
  const sections = [
    ['overview','Dashboard',LayoutDashboard],
    ['applications','Applications',ClipboardList],
    ['users','Applicant accounts',UserRound],
    ['content','News & events',CalendarDays],
  ]
  const activeTitle = sections.find(([key])=>key===activeSection)?.[1] || 'Dashboard'
  return <div className="min-h-screen bg-slate-50">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-academy-deep px-5 py-6 text-white lg:flex"><a href={siteBase} aria-label="Wunderkind Academy home"><SchoolMark className="h-16 w-16 object-contain" /></a><p className="mt-3 font-serif text-lg">Admissions office</p><div className="mt-10 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Workspace</div><nav className="mt-3 flex flex-col gap-1" aria-label="Admin dashboard sections">{sections.map(([key,label,Icon])=><button key={key} type="button" onClick={()=>setActiveSection(key)} aria-current={activeSection===key?'page':undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${activeSection===key?'bg-white text-academy-deep':'text-white/70 hover:bg-white/10 hover:text-white'}`}><Icon size={18}/>{label}</button>)}</nav><a href={siteBase} className="mt-auto flex items-center gap-2 text-sm text-white/60 hover:text-white"><ExternalLink size={16}/> View public website</a><button onClick={onLogout} className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5 text-left text-sm text-white/65 hover:text-white"><LogOut size={16}/> Sign out</button></aside>
    <main className="lg:ml-64"><header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8"><div><p className="text-xs text-slate-500">Wunderkind Academy / Administration</p><h1 className="mt-1 font-serif text-xl text-academy-deep sm:text-2xl">{activeTitle}</h1></div><div className="flex items-center gap-3"><a href={siteBase} className="hidden items-center gap-2 text-sm font-medium text-slate-600 hover:text-academy-deep sm:flex"><ExternalLink size={16}/> Public site</a><button onClick={onLogout} className="rounded-full border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Sign out"><LogOut size={18}/></button></div></header>
      <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden"><nav className="flex gap-2 overflow-x-auto" aria-label="Admin dashboard sections">{sections.map(([key,label,Icon])=><button key={key} type="button" onClick={()=>setActiveSection(key)} aria-current={activeSection===key?'page':undefined} className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-semibold ${activeSection===key?'bg-academy-deep text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Icon size={15}/>{label}</button>)}</nav></div>
      <div className="p-4 sm:p-8">
        {notice&&<div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17}/>{notice}<button className="ml-auto" onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={16}/></button></div>}
        {activeSection==='overview'&&<section><div className="mb-6 rounded-2xl bg-academy-deep p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-academy-gold">Admissions workspace</p><h2 className="mt-3 font-serif text-3xl sm:text-4xl">Welcome to your dashboard</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Review incoming applications, manage family accounts, and keep school announcements up to date.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['All applications',counts.All,ClipboardList,'applications'],['Pending review',counts.Pending,Clock,'applications'],['Approved students',counts.Approved,CheckCircle2,'applications'],['Applicant accounts',applicantAccounts.length,UserRound,'users']].map(([label,num,Icon,target])=><button key={label} type="button" onClick={()=>setActiveSection(target)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-soft"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon size={19} className="text-amber-700"/></div><p className="mt-3 text-3xl font-semibold text-academy-deep">{num}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800">Open section <ArrowRight size={13}/></span></button>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2"><button type="button" onClick={()=>setActiveSection('content')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-amber-300"><CalendarDays className="text-amber-700" size={22}/><h3 className="mt-3 font-semibold text-academy-deep">News & events manager</h3><p className="mt-1 text-sm text-slate-500">Publish announcements and upcoming events.</p></button><button type="button" onClick={()=>setActiveSection('applications')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-amber-300"><ClipboardList className="text-amber-700" size={22}/><h3 className="mt-3 font-semibold text-academy-deep">Review applications</h3><p className="mt-1 text-sm text-slate-500">Record decisions and manage student results.</p></button></div></section>}
        {activeSection==='content'&&<ContentManager/>}
        {activeSection==='users'&&<section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-semibold text-academy-deep">Applicant accounts <span className="text-base font-normal text-slate-500">({applicantAccounts.length})</span></h2><p className="mt-1 text-sm text-slate-500">Accounts created by families to submit and track applications.</p></div>
          {applicantAccountsError?<p role="alert" className="p-5 text-sm text-rose-700">Unable to load applicant accounts: {applicantAccountsError}</p>:applicantAccounts.length===0?<p className="p-5 text-sm text-slate-500">No applicant accounts have been created yet.</p>:<>
            <div className="space-y-3 p-4 md:hidden">{accountsWithParents.map(account=><article key={account.id} className="rounded-xl border border-slate-200 p-4"><p className="break-all text-sm font-semibold text-academy-deep">{account.email||'—'}</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-[11px] text-slate-500">Parent / guardian</p><p className="mt-1 break-words text-sm text-slate-700">{account.parents.length?account.parents.join(', '):'No application yet'}</p></div><div><p className="text-[11px] text-slate-500">Applications</p><p className="mt-1 text-sm text-slate-700">{account.linkedApplications.length}</p></div></div><p className="mt-3 text-xs text-slate-500">Registered {formatDate(account.createdAt)}</p></article>)}</div>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[620px] text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Account email</th><th className="px-5 py-3 font-semibold">Parent / guardian</th><th className="px-5 py-3 font-semibold">Applications</th><th className="px-5 py-3 font-semibold">Registered</th></tr></thead><tbody className="divide-y divide-slate-100">{accountsWithParents.map(account=><tr key={account.id}><td className="px-5 py-3 text-sm font-medium text-academy-deep">{account.email||'—'}</td><td className="px-5 py-3 text-sm text-slate-700">{account.parents.length?account.parents.join(', '):'No application yet'}</td><td className="px-5 py-3 text-sm text-slate-600">{account.linkedApplications.length}</td><td className="px-5 py-3 text-sm text-slate-500">{formatDate(account.createdAt)}</td></tr>)}</tbody></table></div>
          </>}
        </section>}
        {activeSection==='applications'&&<section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold text-academy-deep">Applications</h2><p className="mt-1 text-sm text-slate-500">Review applications and record an admission decision.</p></div><button onClick={refresh} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Refresh list</button></div>
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['All applications',counts.All,ClipboardList],['Pending review',counts.Pending,Clock],['Approved students',counts.Approved,CheckCircle2],['Rejected',counts.Rejected,Ban]].map(([label,num,Icon])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon size={19} className="text-amber-700"/></div><p className="mt-3 text-3xl font-semibold text-academy-deep">{num}</p></div>)}</div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div className="relative w-full md:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className="form-field !py-2.5 !pl-10" placeholder="Search student, guardian, reference..."/></div><div className="flex flex-wrap gap-2">{['All','Pending','Approved','Rejected'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${filter===s?'bg-academy-deep text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s} ({counts[s]})</button>)}</div></div>
          {filtered.length===0?<div className="px-6 py-16 text-center"><ClipboardList size={35} className="mx-auto text-slate-300"/><h3 className="mt-4 font-semibold text-academy-deep">No applications found</h3><p className="mt-2 text-sm text-slate-500">{applications.length===0?'New applications will appear here after someone submits the public admission form.':'Try another search or status filter.'}</p><a href={applyPath} className="mt-4 inline-flex text-sm font-semibold text-amber-700">Open application form <ArrowUpRight size={15}/></a></div>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4 font-semibold">Student / reference</th><th className="px-5 py-4 font-semibold">Program</th><th className="px-5 py-4 font-semibold">Guardian</th><th className="px-5 py-4 font-semibold">Submitted</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(a=><tr key={a.id} className="hover:bg-slate-50/80"><td className="px-5 py-4"><p className="font-semibold text-academy-deep">{a.studentName}</p><p className="mt-1 text-xs text-slate-400">{a.id}</p></td><td className="px-5 py-4 text-sm text-slate-600">{a.applyingFor}</td><td className="px-5 py-4"><p className="text-sm text-slate-700">{a.guardianName}</p><p className="mt-1 text-xs text-slate-400">{a.guardianPhone}</p></td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(a.submittedAt)}</td><td className="px-5 py-4"><StatusPill status={a.status}/></td><td className="px-5 py-4"><button onClick={()=>setSelected(a)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Eye size={14}/> Review</button></td></tr>)}</tbody></table></div>}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-800"><AlertCircle size={16} className="mt-0.5 shrink-0"/></p>
        </section>}
      </div>
    </main>
    <AnimatePresence>{current&&<motion.div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><motion.aside initial={{x:60}} animate={{x:0}} exit={{x:60}} transition={{type:'tween',duration:.22}} className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Application review</p><h2 className="mt-2 font-serif text-2xl text-academy-deep">{current.studentName}</h2><p className="mt-1 text-xs text-slate-500">{current.id}</p></div><button onClick={()=>setSelected(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close details"><X size={20}/></button></div><div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><StatusPill status={current.status}/><span className="text-xs text-slate-500">Submitted {formatDate(current.submittedAt)}</span></div><button type="button" onClick={async()=>{try{await downloadApplicationPdf(current)}catch(err){setNotice(`PDF download failed: ${err.message}`)}}} className="inline-flex items-center gap-2 rounded-full bg-academy-deep px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-academy-navy"><Download size={15}/> Download PDF</button></div>
      <section><h3 className="mb-3 text-sm font-bold text-academy-deep">Pupil particulars / Taarifa ya mwanafunzi</h3><div className="grid grid-cols-2 gap-3">{[['Form date',current.formDate],['Full name',current.studentName],['Nickname',current.nickname],['Sex',current.gender],['Date of birth',formatDate(current.dateOfBirth)],['Nationality',current.nationality],['Birth place',current.birthPlace],['Home address',current.address],['Stays with',current.staysWith],['Birth certificate attached',current.birthCertificateAttached],['Last school',current.previousSchool],['Religion',current.religion],['Allergies',current.allergies],['Sickness from birth',current.congenitalIllness],['Class requested',current.applyingFor]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-800">{value||'—'}</p></div>)}</div>{(current.otherChildInformation||current.notes)&&<div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Other important information</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{current.otherChildInformation||current.notes}</p></div>}</section>
      <section><h3 className="mb-3 text-sm font-bold text-academy-deep">Mother / Mlezi 1</h3><div className="grid grid-cols-2 gap-3">{[['Full name',current.mother?.name||current.guardianRelationship==='Mother'&&current.guardianName],['Phone',current.mother?.phone||current.guardianRelationship==='Mother'&&current.guardianPhone],['Work',current.mother?.work],['NIDA number',current.mother?.nida]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value||'—'}</p></div>)}</div></section>
      <section><h3 className="mb-3 text-sm font-bold text-academy-deep">Father / Mlezi 2</h3><div className="grid grid-cols-2 gap-3">{[['Full name',current.father?.name||current.guardianRelationship==='Father'&&current.guardianName],['Phone',current.father?.phone||current.guardianRelationship==='Father'&&current.guardianPhone],['Work',current.father?.work],['NIDA number',current.father?.nida]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value||'—'}</p></div>)}</div></section>
      <section><h3 className="mb-3 text-sm font-bold text-academy-deep">Other contact / Mawasiliano ya mtu mwingine</h3><div className="grid grid-cols-2 gap-3">{[['Full name',current.otherContact?.name||(!current.mother&&!current.father&&!['Mother','Father'].includes(current.guardianRelationship)?current.guardianName:'')],['Phone',current.otherContact?.phone||(!current.mother&&!current.father&&!['Mother','Father'].includes(current.guardianRelationship)?current.guardianPhone:'')],['Address',current.otherContact?.address||(!current.mother&&!current.father&&!['Mother','Father'].includes(current.guardianRelationship)?current.address:'')],['NIDA number',current.otherContact?.nida],['Email',current.guardianEmail]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value||'—'}</p></div>)}</div></section>
      <ApplicationResultsEditor application={current}/>
      {current.reviewedAt&&<p className="text-xs text-slate-500">Last decision recorded: {formatDate(current.reviewedAt)}</p>}<div className="border-t border-slate-100 pt-5"><h3 className="text-sm font-bold text-academy-deep">Record decision</h3><p className="mt-1 text-xs leading-5 text-slate-500">This saves the decision to Firestore.</p><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={()=>changeStatus(current.id,'Approved')} disabled={current.status==='Approved'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><Check size={17}/> Approve student</button><button onClick={()=>changeStatus(current.id,'Rejected')} disabled={current.status==='Rejected'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Ban size={17}/> Reject</button></div><button onClick={()=>removeApplication(current.id)} className="mt-4 text-xs font-semibold text-rose-700 underline">Delete application</button></div></div></motion.aside></motion.div>}</AnimatePresence>
  </div>
}

function NewsEvents() {
  const [news] = useCollection('news',true)
  const [events] = useCollection('events',true)
  const published = news.filter(x=>x.published).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
  const upcoming = events.filter(x=>x.published && x.date && x.date >= new Date().toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date))
  return <section id="news-events" className="section-space bg-white"><div className="container-wide"><SectionHeading eyebrow="School updates" title="Latest News & Upcoming Events" text="Discover what is happening at Wunderkind Academy."/><div className="mt-10 grid gap-10 md:grid-cols-2"><div><h3 className="mb-5 font-serif text-2xl text-academy-deep">Latest news</h3><div className="space-y-4">{published.length===0?<p className="text-slate-500">News updates will appear here soon.</p>:published.slice(0,6).map(x=><article key={x.id} className="rounded-xl border border-slate-200 p-5"><h4 className="font-semibold text-academy-deep">{x.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{x.body}</p></article>)}</div></div><div><h3 className="mb-5 font-serif text-2xl text-academy-deep">Upcoming events</h3><div className="space-y-4">{upcoming.length===0?<p className="text-slate-500">Upcoming events will appear here soon.</p>:upcoming.slice(0,6).map(x=><article key={x.id} className="rounded-xl border border-slate-200 p-5"><p className="text-xs font-semibold text-amber-700">{formatDate(x.date)} {x.time||''}</p><h4 className="mt-2 font-semibold text-academy-deep">{x.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{x.body}</p></article>)}</div></div></div></div></section>
}
function ContentManager() {
  const [kind,setKind]=useState('news')
  const [news,newsError]=useCollection('news')
  const [events,eventsError]=useCollection('events')
  const [editing,setEditing]=useState(null)
  const [error,setError]=useState('')
  const [saving,setSaving]=useState(false)
  const items=(kind==='news'?news:events).slice().sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
  async function save(e) {
    e.preventDefault();setSaving(true);setError('')
    const data=new FormData(e.currentTarget)
    const payload={title:String(data.get('title')).trim(),body:String(data.get('body')).trim(),published:data.get('published')==='on',updatedAt:serverTimestamp()}
    if(kind==='events'){payload.date=String(data.get('date'));payload.time=String(data.get('time')||'')}
    try {if(editing)await updateDoc(doc(db,kind,editing.id),payload);else await addDoc(collection(db,kind),{...payload,createdAt:serverTimestamp()});setEditing(null);e.currentTarget.reset()}
    catch(err){setError(err.message)}finally{setSaving(false)}
  }
  async function remove(id){if(!window.confirm('Delete this item permanently?'))return;try{await deleteDoc(doc(db,kind,id));setEditing(null)}catch(err){setError(err.message)}}
  return <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-serif text-2xl text-academy-deep">News & events manager</h2><p className="mt-1 text-sm text-slate-500">Create, edit, publish or unpublish school announcements.</p><div className="my-5 flex gap-3">{['news','events'].map(x=><button key={x} onClick={()=>{setKind(x);setEditing(null)}} className={'rounded-full px-5 py-2 text-sm font-semibold '+(kind===x?'bg-academy-deep text-white':'bg-slate-100 text-slate-700')}>{x==='news'?'Latest news':'Upcoming events'}</button>)}</div><form key={kind+'-'+(editing?.id||'new')} onSubmit={save} className="grid gap-3 md:grid-cols-2"><label className="text-sm">Title<input className="form-field mt-1" required name="title" defaultValue={editing?.title||''}/></label>{kind==='events'&&<><label className="text-sm">Date<input className="form-field mt-1" required type="date" name="date" defaultValue={editing?.date||''}/></label><label className="text-sm">Time<input className="form-field mt-1" type="time" name="time" defaultValue={editing?.time||''}/></label></>}<label className="text-sm md:col-span-2">Description<textarea className="form-field mt-1" required rows="3" name="body" defaultValue={editing?.body||''}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published??true}/> Publish on public website</label><div className="flex gap-3"><button disabled={saving} className="rounded-full bg-academy-deep px-5 py-2 text-white">{saving?'Saving…':editing?'Save changes':'Add '+(kind==='news'?'news':'event')}</button>{editing&&<button type="button" onClick={()=>setEditing(null)} className="text-sm underline">Cancel</button>}</div></form>{(error||newsError||eventsError)&&<p role="alert" className="mt-3 text-sm text-rose-700">{error||newsError||eventsError}</p>}<div className="mt-6 divide-y divide-slate-100">{items.map(x=><div key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><strong className="text-sm">{x.title}</strong><p className="text-xs text-slate-500">{x.date||''} · {x.published?'Published':'Draft'}</p></div><div className="flex gap-3"><button onClick={()=>setEditing(x)} className="text-sm font-semibold text-blue-700">Edit</button><button onClick={()=>remove(x.id)} className="text-sm font-semibold text-rose-700">Delete</button></div></div>)}</div></section>
}

function AdminPage() {
  const [user,setUser]=useState(undefined)
  const [allowed,setAllowed]=useState(false)
  useEffect(()=>onAuthStateChanged(auth,async current=>{
    setUser(current)
    if (!current) {setAllowed(false);return}
    try {const snap=await getDoc(doc(db,'admins',current.uid));setAllowed(snap.exists() && snap.data().active===true)}
    catch {setAllowed(false)}
  }),[])
  if(user===undefined) return <div className="p-12">Checking administrator session…</div>
  if(!user) return <AdminLogin/>
  if(!allowed) return <div className="mx-auto max-w-lg p-12"><h1 className="text-2xl font-bold">Access restricted</h1><p className="mt-4">Your account is not listed as an active school administrator.</p><button className="mt-5 underline" onClick={()=>signOut(auth)}>Sign out</button></div>
  return <AdminDashboard onLogout={()=>signOut(auth)}/>
}

export default function App() {
  const currentPath = window.location.pathname.replace(/\/+$/,'')
  const isAdmin = currentPath === adminPath.replace(/\/+$/,'')
  const isApplyPage = currentPath === applyPath.replace(/\/+$/,'')
  const isAccountPage = currentPath === accountPath.replace(/\/+$/,'')
  if(isAdmin) return <AdminPage/>
  if(isApplyPage||isAccountPage) return <><Navbar applyPage/><ApplicantPortal showApplicationForm={isApplyPage}/>{!isAccountPage&&<Footer applyPage/>}</>
  return <><Navbar/><main><Hero/><About/><Academics/><WhyUs/><Facilities/><StudentLife/><NewsEvents/><AdmissionsIntro/><Contact/></main><Footer/></>
}
