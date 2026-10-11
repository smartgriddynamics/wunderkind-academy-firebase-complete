import { auth, db } from './firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, ArrowUpRight, ArrowRight, GraduationCap, BookOpen, Users,
  ShieldCheck, Microscope, Laptop, LibraryBig, Trees, Monitor, Palette,
  MapPin, Phone, Mail, Clock, CheckCircle2, ChevronDown, Lightbulb,
  HeartHandshake, Music, Trophy, Code2, Facebook, Instagram, Youtube,
  ClipboardList, Search, LogOut, Check, Ban, Eye, LayoutDashboard,
  UserRound, CalendarDays, FileText, AlertCircle, ExternalLink
} from 'lucide-react'

const siteBase = import.meta.env.BASE_URL
const adminPath = `${siteBase}admin`

function SchoolMark({ className = '' }) {
  return <span aria-hidden="true" className={`flex shrink-0 items-center justify-center ${className}`}><GraduationCap className="h-full w-full" strokeWidth={1.6} /></span>
}

// Place your own approved photos in public/images and update these paths.
// Example: hero: `${siteBase}images/students-learning.jpg`
const photos = {
  hero: `${siteBase}images/students-learning.jpg`,
  about: `${siteBase}images/classroom.jpg`,
  early: `${siteBase}images/early-years.jpg`,
  primary: `${siteBase}images/classroom.jpg`,
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
  ['Student Life', '#student-life'], ['Admissions', '#admissions'], ['Contact', '#contact'],
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
function formatDate(value) {
  if (!value) return '—'
  return new Date(value?.toDate ? value.toDate() : value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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

function Navbar() {
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
      <a href="#home" className="flex min-w-0 items-center gap-3" aria-label="Wunderkind Academy home"><SchoolMark className="h-12 w-12 rounded-xl bg-amber-50 p-2.5 text-amber-700" /><span className="min-w-0"><span className="block font-serif text-lg font-semibold leading-tight text-academy-deep sm:text-xl">Wunderkind</span><span className="block text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Academy</span></span></a>
      <nav className="hidden items-center gap-6 xl:flex" aria-label="Main navigation">{navLinks.map(([label, href]) => <a key={href} href={href} className="text-[13px] font-medium text-slate-600 transition hover:text-amber-700">{label}</a>)}</nav>
      <div className="hidden xl:block"><a href="#admissions" className="inline-flex items-center gap-2 rounded-full bg-academy-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-academy-navy">Apply Now <ArrowUpRight size={16} /></a></div>
      <button className="rounded-lg p-2 text-academy-deep xl:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={25} /> : <Menu size={25} />}</button>
    </div>
    <AnimatePresence>{open && <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-slate-100 bg-white xl:hidden"><div className="container-wide flex flex-col py-3">{navLinks.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="border-b border-slate-100 py-3 text-sm font-medium text-slate-700">{label}</a>)}<a href="#admissions" onClick={() => setOpen(false)} className="mt-4 rounded-full bg-academy-deep px-5 py-3 text-center text-sm font-semibold text-white">Apply Now <ArrowUpRight className="ml-1 inline" size={16} /></a><a href={adminPath} className="py-3 text-center text-xs text-slate-500">Staff / Admin portal</a></div></motion.nav>}</AnimatePresence>
  </header>
}

function Hero() {
  return <section id="home" className="relative flex min-h-[760px] items-center overflow-hidden bg-slate-100 pt-20 md:min-h-[850px]"><div className="absolute inset-0"><img src={photos.hero} alt="Students learning together in a classroom" className="h-full w-full object-cover object-center" onError={(e) => { e.currentTarget.style.display = 'none' }} /><div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/45 md:to-white/10" /><div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/10" /></div>
    <div className="container-wide relative z-10 grid items-center gap-10 py-20 md:grid-cols-[1.05fr_.95fr]"><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75 }}><span className="eyebrow">Learning with purpose</span><h1 className="heading mt-6 max-w-3xl text-5xl text-academy-deep sm:text-6xl lg:text-7xl">Nurturing Young Minds for a <span className="text-amber-700">Brighter Future.</span></h1><p className="mt-7 max-w-xl text-base leading-8 text-slate-700 md:text-lg">At Wunderkind Academy, we provide excellence in academics, creativity, and character development. Our holistic approach prepares students to thrive in an ever-changing world.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#admissions" className="inline-flex items-center gap-3 rounded-full bg-academy-deep px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-academy-navy">Apply for Admission <ArrowRight size={17} /></a><a href="#about" className="inline-flex items-center gap-2 rounded-full border border-academy-deep/20 bg-white/70 px-6 py-4 text-sm font-semibold text-academy-deep transition hover:border-academy-gold hover:bg-white">Discover Our School</a></div><div className="mt-10 flex items-center gap-3 text-sm text-slate-600"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm"><GraduationCap size={19} /></span><span>Academics · Creativity · Character</span></div></motion.div>
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

function Admissions() {
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')
  const [busy,setBusy] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const email = String(data.get('guardianEmail') || '').trim().toLowerCase()
    const studentName = String(data.get('studentName') || '').trim()
    const application = {
      id: makeId(),
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      studentName,
      dateOfBirth: data.get('dateOfBirth'),
      gender: data.get('gender'),
      applyingFor: data.get('applyingFor'),
      previousSchool: data.get('previousSchool'),
      guardianName: data.get('guardianName'),
      guardianRelationship: data.get('guardianRelationship'),
      guardianPhone: data.get('guardianPhone'),
      guardianEmail: email,
      address: data.get('address'),
      notes: data.get('notes') || '',
    }
    setBusy(true)
    try {
      const result = await addDoc(collection(db,'applications'), {...application, submittedAt:serverTimestamp()})
      setSubmitted({...application,id:result.id})
    } catch(err) { setError(`Unable to submit application: ${err.message}`); setBusy(false); return }
    setBusy(false)
    form.reset()
  }
  return <section id="admissions" className="section-space relative overflow-hidden bg-academy-deep text-white"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-academy-gold/20"/><div className="container-wide relative"><Reveal><div className="max-w-2xl"><span className="eyebrow !text-academy-gold">Admissions</span><h2 className="heading mt-4 text-4xl md:text-5xl">Your Child’s Journey Starts Here</h2><p className="mt-5 text-base leading-8 text-white/70 md:text-lg">Complete the application form below. Your application will be recorded as pending until the school admissions team reviews it.</p></div></Reveal>
    <div className="mt-12 grid gap-7 md:grid-cols-4">{[['01','Inquiry','Learn about the school and the program.'],['02','Application','Provide student and parent/guardian details.'],['03','Assessment','The school may contact your family about assessment.'],['04','Decision','The admissions team reviews and updates your application.']].map(([n,t,d],i)=><Reveal key={n} delay={i*.08}><div className="relative h-full border-t border-white/20 pt-5"><span className="font-serif text-4xl text-academy-gold/90">{n}</span><h3 className="mt-4 font-serif text-2xl">{t}</h3><p className="mt-3 text-sm leading-7 text-white/65">{d}</p></div></Reveal>)}</div>
    <div className="mt-14 grid gap-10 rounded-3xl bg-white p-6 text-academy-deep shadow-soft md:p-10 lg:grid-cols-[.72fr_1.28fr]">
      <div><span className="eyebrow">Student application</span><h3 className="heading mt-4 text-3xl md:text-4xl">Apply to Wunderkind Academy</h3><p className="mt-4 leading-7 text-slate-600">Please enter accurate information. Fields marked * are required. After submitting, keep the application reference number for follow-up.</p><div className="mt-8 rounded-xl bg-academy-light p-4 text-sm leading-6 text-slate-600"><ClipboardList size={20} className="mb-2 text-amber-700"/>Applications are submitted securely to the school admissions team.</div>{submitted&&<div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 size={20}/> Application submitted</div><p className="mt-2 text-sm leading-6 text-emerald-900">Reference: <strong>{submitted.id}</strong><br/>Student: {submitted.studentName}<br/>Status: Pending review</p><button type="button" onClick={()=>setSubmitted(null)} className="mt-3 text-sm font-semibold text-emerald-800 underline">Submit another application</button></div>}</div>
      <form onSubmit={handleSubmit} className="grid content-start gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700">Student information</p><div className="gold-line"/></div>
        <label className="text-xs font-semibold text-slate-700">Student full name *<input required name="studentName" className="form-field mt-2" placeholder="As shown on official documents"/></label>
        <label className="text-xs font-semibold text-slate-700">Date of birth *<input required name="dateOfBirth" type="date" max={new Date().toISOString().slice(0,10)} className="form-field mt-2"/></label>
        <label className="text-xs font-semibold text-slate-700">Gender<select required name="gender" defaultValue="" className="form-field mt-2"><option value="" disabled>Select</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Applying for *<select required name="applyingFor" defaultValue="" className="form-field mt-2"><option value="" disabled>Select a program</option><option>Early Years</option><option>Grade 1</option><option>Grade 2</option><option>Grade 3</option><option>Grade 4</option><option>Grade 5</option><option>Grade 6</option></select></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Previous school (if any)<input name="previousSchool" className="form-field mt-2" placeholder="Name of previous school"/></label>
        <div className="mt-2 sm:col-span-2"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700">Parent / guardian information</p><div className="gold-line"/></div>
        <label className="text-xs font-semibold text-slate-700">Parent / guardian full name *<input required name="guardianName" className="form-field mt-2" placeholder="Full name"/></label>
        <label className="text-xs font-semibold text-slate-700">Relationship to student *<select required name="guardianRelationship" defaultValue="" className="form-field mt-2"><option value="" disabled>Select</option><option>Mother</option><option>Father</option><option>Guardian</option><option>Other</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Phone number *<input required name="guardianPhone" type="tel" className="form-field mt-2" placeholder="+255..."/></label>
        <label className="text-xs font-semibold text-slate-700">Email address *<input required name="guardianEmail" type="email" className="form-field mt-2" placeholder="you@example.com"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Home address / area *<input required name="address" className="form-field mt-2" placeholder="Ward, street, or area"/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Additional information<textarea name="notes" rows="3" className="form-field mt-2 resize-y" placeholder="Anything the admissions team should know?"/></label>
        {error&&<p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="sm:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-full bg-academy-deep px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-academy-navy">Submit Application <ArrowRight size={16}/></button><p className="mt-3 text-xs leading-5 text-slate-500">Applications are securely stored in the school database. Keep your reference number.</p></div>
      </form>
    </div></div></section>
}

function Contact() {
  const [sent,setSent]=useState(false)
  return <section id="contact" className="section-space bg-academy-light"><div className="container-wide"><Reveal><SectionHeading eyebrow="Get in touch" title="We’d Love to Hear From You" text="Have questions about admissions, academic programs, or school life? Get in touch with Wunderkind Academy."/></Reveal><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><Reveal><div className="rounded-2xl bg-white p-7 shadow-sm md:p-9"><h3 className="font-serif text-2xl text-academy-deep">Contact information</h3><p className="mt-3 text-sm leading-7 text-slate-600">Our team is available during school office hours to help with your questions.</p><div className="mt-7 space-y-6"><a href="https://maps.google.com/?q=Kishiri+Mwanza+Tanzania" target="_blank" rel="noreferrer" className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><MapPin size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Visit us</span><span className="mt-1 block text-sm text-slate-500">Kishiri, Mwanza, Tanzania</span></span></a><a href="tel:+255749281607" className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Phone size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Call us</span><span className="mt-1 block text-sm text-slate-500">+255 749 281 607</span></span></a><a href="mailto:director@wunderkindacademyschool.org" className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Mail size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Email us</span><span className="mt-1 block break-all text-sm text-slate-500">director@wunderkindacademyschool.org</span></span></a><div className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Clock size={20}/></span><span><span className="block text-sm font-semibold text-academy-deep">Office hours</span><span className="mt-1 block text-sm text-slate-500">Monday–Friday, 8:00 AM–5:00 PM</span></span></div></div></div></Reveal>
    <Reveal delay={.1}><form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);try{await addDoc(collection(db,'messages'),{name:data.get('name'),email:data.get('email'),subject:data.get('subject'),message:data.get('message'),createdAt:serverTimestamp()});setSent(true);form.reset()}catch(err){alert('Message not sent: '+err.message)}}} className="rounded-2xl bg-white p-7 shadow-sm md:p-9"><h3 className="font-serif text-2xl text-academy-deep">Send us a message</h3><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Full name *<input required className="form-field mt-2" name="name" placeholder="Your full name"/></label><label className="text-xs font-semibold text-slate-700">Email address *<input required type="email" className="form-field mt-2" name="email" placeholder="you@example.com"/></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Subject *<input required className="form-field mt-2" name="subject" placeholder="What would you like to ask?"/></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Message *<textarea required rows="5" className="form-field mt-2 resize-y" name="message" placeholder="Write your message here..."/></label></div><button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-full bg-academy-deep px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-academy-navy">Send Message <ArrowRight size={16}/></button>{sent&&<p role="status" className="mt-3 text-sm text-amber-800">Your message has been received by the school.</p>}</form></Reveal></div></div></section>
}

function Footer() {
  return <footer className="bg-[#0B1C2E] text-white"><div className="container-wide grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4"><div><a href="#home" className="flex items-center gap-3"><SchoolMark className="h-12 w-12 rounded-md bg-white p-2.5 text-academy-deep" /><span><span className="block font-serif text-xl">Wunderkind</span><span className="text-[10px] uppercase tracking-[.2em] text-white/55">Academy</span></span></a><p className="mt-5 max-w-xs text-sm leading-7 text-white/60">Nurturing young minds through academic excellence, creativity, and character development since 2005.</p><div className="mt-5 flex gap-3"><a aria-label="Facebook" href="#contact" className="rounded-full border border-white/15 p-2.5 text-white/70 hover:text-academy-gold"><Facebook size={17}/></a><a aria-label="Instagram" href="#contact" className="rounded-full border border-white/15 p-2.5 text-white/70 hover:text-academy-gold"><Instagram size={17}/></a><a aria-label="YouTube" href="#contact" className="rounded-full border border-white/15 p-2.5 text-white/70 hover:text-academy-gold"><Youtube size={17}/></a></div></div><div><h3 className="text-sm font-semibold">Explore</h3><ul className="mt-5 space-y-3 text-sm text-white/60">{[['About Us','#about'],['Academic Programs','#academics'],['Our Facilities','#facilities'],['Student Life','#student-life']].map(([t,h])=><li key={h}><a className="hover:text-academy-gold" href={h}>{t}</a></li>)}</ul></div><div><h3 className="text-sm font-semibold">Admissions</h3><ul className="mt-5 space-y-3 text-sm text-white/60"><li><a className="hover:text-academy-gold" href="#admissions">Admissions Process</a></li><li><a className="hover:text-academy-gold" href="#admissions">Apply for Admission</a></li><li><a className="hover:text-academy-gold" href={adminPath}>Staff / Admin Portal</a></li></ul></div><div><h3 className="text-sm font-semibold">Contact</h3><ul className="mt-5 space-y-4 text-sm text-white/60"><li className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-academy-gold"/>Kishiri, Mwanza, Tanzania</li><li className="flex gap-3"><Phone size={17} className="shrink-0 text-academy-gold"/><a href="tel:+255749281607" className="hover:text-white">+255 749 281 607</a></li><li className="flex gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-academy-gold"/><a href="mailto:director@wunderkindacademyschool.org" className="break-all hover:text-white">director@wunderkindacademyschool.org</a></li><li className="flex gap-3"><Clock size={17} className="shrink-0 text-academy-gold"/>Mon–Fri: 8:00 AM–5:00 PM</li></ul></div></div><div className="border-t border-white/10"><div className="container-wide flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Wunderkind Academy. All rights reserved.</p><a href="#home" className="hover:text-academy-gold">Back to top ↑</a></div></div></footer>
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
  return <div className="min-h-screen bg-academy-light px-4 py-12"><div className="mx-auto max-w-md"><a href={siteBase} className="mb-8 inline-flex items-center gap-3"><SchoolMark className="h-12 w-12 rounded-xl bg-amber-50 p-2.5 text-amber-700" /><span><span className="block font-serif text-xl text-academy-deep">Wunderkind Academy</span><span className="text-xs text-slate-500">Admissions administration</span></span></a><div className="rounded-3xl bg-white p-8 shadow-soft sm:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><ShieldCheck size={28}/></div><h1 className="heading mt-5 text-3xl text-academy-deep">Admin sign in</h1><p className="mt-3 text-sm leading-6 text-slate-600">Sign in using your authorized school administrator account.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-xs font-semibold text-slate-700">Email<input type="email" required value={username} onChange={e=>setUsername(e.target.value)} className="form-field mt-2" autoComplete="username" placeholder="admin@school.org"/></label><label className="block text-xs font-semibold text-slate-700">Password<input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="form-field mt-2" autoComplete="current-password" placeholder="Password"/></label>{error&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<button className="flex w-full items-center justify-center gap-2 rounded-full bg-academy-deep px-5 py-3.5 text-sm font-semibold text-white hover:bg-academy-navy">Sign in <ArrowRight size={16}/></button></form><a href={siteBase} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-academy-deep"><ArrowRight className="rotate-180" size={15}/> Return to school website</a></div></div></div>
}

function AdminDashboard({ onLogout }) {
  const [applications,applicationsError] = useCollection('applications')
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
  const filtered = useMemo(() => applications.filter(a => (filter==='All'||a.status===filter) && [a.studentName,a.guardianName,a.guardianEmail,a.id,a.applyingFor].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))), [applications,filter,search])
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
  return <div className="min-h-screen bg-slate-50">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-academy-deep px-5 py-6 text-white lg:flex"><a href={siteBase} className="flex items-center gap-3"><SchoolMark className="h-11 w-11 rounded-lg bg-white p-2 text-academy-deep" /><span><span className="block font-serif text-lg">Wunderkind</span><span className="text-[10px] uppercase tracking-[.2em] text-white/55">Academy</span></span></a><div className="mt-12 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Workspace</div><div className="mt-3 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold"><LayoutDashboard size={18}/> Admissions dashboard</div><a href={siteBase} className="mt-auto flex items-center gap-2 text-sm text-white/60 hover:text-white"><ExternalLink size={16}/> View public website</a><button onClick={onLogout} className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5 text-left text-sm text-white/65 hover:text-white"><LogOut size={16}/> Sign out</button></aside>
    <main className="lg:ml-64"><header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8"><div><p className="text-xs text-slate-500">Wunderkind Academy / Administration</p><h1 className="mt-1 font-serif text-xl text-academy-deep sm:text-2xl">Admissions dashboard</h1></div><div className="flex items-center gap-3"><a href={siteBase} className="hidden items-center gap-2 text-sm font-medium text-slate-600 hover:text-academy-deep sm:flex"><ExternalLink size={16}/> Public site</a><button onClick={onLogout} className="rounded-full border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Sign out"><LogOut size={18}/></button></div></header>
      <div className="p-5 sm:p-8"><ContentManager/><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold text-academy-deep">Applications</h2><p className="mt-1 text-sm text-slate-500">Review applications and record an admission decision.</p></div><button onClick={refresh} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Refresh list</button></div>
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['All applications',counts.All,ClipboardList],['Pending review',counts.Pending,Clock],['Approved students',counts.Approved,CheckCircle2],['Rejected',counts.Rejected,Ban]].map(([label,num,Icon])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon size={19} className="text-amber-700"/></div><p className="mt-3 text-3xl font-semibold text-academy-deep">{num}</p></div>)}</div>
        {notice&&<div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17}/>{notice}<button className="ml-auto" onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={16}/></button></div>}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div className="relative w-full md:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className="form-field !py-2.5 !pl-10" placeholder="Search student, guardian, reference..."/></div><div className="flex flex-wrap gap-2">{['All','Pending','Approved','Rejected'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${filter===s?'bg-academy-deep text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s} ({counts[s]})</button>)}</div></div>
          {filtered.length===0?<div className="px-6 py-16 text-center"><ClipboardList size={35} className="mx-auto text-slate-300"/><h3 className="mt-4 font-semibold text-academy-deep">No applications found</h3><p className="mt-2 text-sm text-slate-500">{applications.length===0?'New applications will appear here after someone submits the public admission form.':'Try another search or status filter.'}</p><a href={`${siteBase}#admissions`} className="mt-4 inline-flex text-sm font-semibold text-amber-700">Open application form <ArrowUpRight size={15}/></a></div>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4 font-semibold">Student / reference</th><th className="px-5 py-4 font-semibold">Program</th><th className="px-5 py-4 font-semibold">Guardian</th><th className="px-5 py-4 font-semibold">Submitted</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(a=><tr key={a.id} className="hover:bg-slate-50/80"><td className="px-5 py-4"><p className="font-semibold text-academy-deep">{a.studentName}</p><p className="mt-1 text-xs text-slate-400">{a.id}</p></td><td className="px-5 py-4 text-sm text-slate-600">{a.applyingFor}</td><td className="px-5 py-4"><p className="text-sm text-slate-700">{a.guardianName}</p><p className="mt-1 text-xs text-slate-400">{a.guardianPhone}</p></td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(a.submittedAt)}</td><td className="px-5 py-4"><StatusPill status={a.status}/></td><td className="px-5 py-4"><button onClick={()=>setSelected(a)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Eye size={14}/> Review</button></td></tr>)}</tbody></table></div>}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-800"><AlertCircle size={16} className="mt-0.5 shrink-0"/>Prototype notice: records are saved only in this browser's local storage. This is not a secure shared admissions system and should not be used for real student records until connected to a protected backend.</p>
      </div>
    </main>
    <AnimatePresence>{current&&<motion.div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><motion.aside initial={{x:60}} animate={{x:0}} exit={{x:60}} transition={{type:'tween',duration:.22}} className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Application review</p><h2 className="mt-2 font-serif text-2xl text-academy-deep">{current.studentName}</h2><p className="mt-1 text-xs text-slate-500">{current.id}</p></div><button onClick={()=>setSelected(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close details"><X size={20}/></button></div><div className="space-y-6 p-6"><div className="flex items-center justify-between"><StatusPill status={current.status}/><span className="text-xs text-slate-500">Submitted {formatDate(current.submittedAt)}</span></div><div><h3 className="mb-3 text-sm font-bold text-academy-deep">Student information</h3><div className="grid grid-cols-2 gap-4">{[['Date of birth',formatDate(current.dateOfBirth)],['Gender',current.gender],['Applying for',current.applyingFor],['Previous school',current.previousSchool||'Not provided']].map(([k,v])=><div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{k}</p><p className="mt-1 text-sm font-medium text-slate-800">{v}</p></div>)}</div></div><div><h3 className="mb-3 text-sm font-bold text-academy-deep">Parent / guardian</h3><div className="space-y-3 rounded-xl border border-slate-100 p-4 text-sm"><p><span className="text-slate-500">Name: </span>{current.guardianName}</p><p><span className="text-slate-500">Relationship: </span>{current.guardianRelationship}</p><p><span className="text-slate-500">Phone: </span>{current.guardianPhone}</p><p><span className="text-slate-500">Email: </span>{current.guardianEmail}</p><p><span className="text-slate-500">Address: </span>{current.address}</p></div></div>{current.notes&&<div><h3 className="mb-2 text-sm font-bold text-academy-deep">Additional information</h3><p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{current.notes}</p></div>}{current.reviewedAt&&<p className="text-xs text-slate-500">Last decision recorded: {formatDate(current.reviewedAt)}</p>}<div className="border-t border-slate-100 pt-5"><h3 className="text-sm font-bold text-academy-deep">Record decision</h3><p className="mt-1 text-xs leading-5 text-slate-500">This saves the decision to Firestore.</p><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={()=>changeStatus(current.id,'Approved')} disabled={current.status==='Approved'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><Check size={17}/> Approve student</button><button onClick={()=>changeStatus(current.id,'Rejected')} disabled={current.status==='Rejected'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Ban size={17}/> Reject</button></div><button onClick={()=>removeApplication(current.id)} className="mt-4 text-xs font-semibold text-rose-700 underline">Delete application</button></div></div></motion.aside></motion.div>}</AnimatePresence>
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
  const isAdmin = window.location.pathname.replace(/\/+$/,'') === adminPath.replace(/\/+$/,'')
  return isAdmin ? <AdminPage/> : <><Navbar/><main><Hero/><About/><Academics/><WhyUs/><Facilities/><StudentLife/><NewsEvents/><Admissions/><Contact/></main><Footer/></>
}
