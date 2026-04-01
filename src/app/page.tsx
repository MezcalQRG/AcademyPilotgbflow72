import { getAcademyPhotos } from '@/app/actions';
import { PhotoGrid } from '@/components/photo-grid';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FreeTrialDialog } from '@/components/landing/free-trial-dialog';
import Marquee from '@/components/landing/Marquee';
import { ScrollRevealImage } from '@/components/landing/scroll-reveal-image';
import { BackgroundPhotoRotation } from '@/components/landing/background-photo-rotation';
import { AuthModal } from '@/components/auth/auth-modal';
import { 
  Trophy, 
  Users, 
  Shield, 
  ArrowRight, 
  MapPin, 
  History, 
  UserCircle
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function LandingPage() {
  const photos = await getAcademyPhotos("310 S Glendora Ave West Covina 91790");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/20 backdrop-blur-xl border-b-2 border-border shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10">
              <img 
                src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                alt="Gracie Barra Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline text-2xl font-black uppercase italic text-primary">GRACIE BARRA AI</span>
              <span className="font-headline text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Pilot System</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
            <Link href="#programs" className="hover:text-primary transition-colors">Programas</Link>
            <Link href="/locator" className="hover:text-primary transition-colors">Find a School</Link>
            <AuthModal 
              mode="admin" 
              trigger={
                <button className="hover:text-primary transition-colors text-primary font-black uppercase tracking-[0.2em]">
                  Admin Hub
                </button>
              } 
            />
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <AuthModal 
              mode="student" 
              trigger={
                <Button variant="outline" className="hidden sm:inline-flex font-black uppercase tracking-widest text-[10px] border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-none h-10 px-6">
                  <UserCircle className="mr-2 h-4 w-4" /> Student Portal
                </Button>
              } 
            />
            <FreeTrialDialog>
              <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest px-8 rounded-none h-10">
                Free Trial
              </Button>
            </FreeTrialDialog>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center overflow-hidden bg-slate-50 dark:bg-black">
          <PhotoGrid photoUrls={photos} />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-block bg-primary px-4 py-1 text-white text-[10px] font-black uppercase tracking-[0.3em] italic shadow-sm">
                Organizing the World of Jiu-Jitsu
              </div>
              <h1 className="font-headline text-6xl md:text-8xl font-black leading-none uppercase italic text-slate-900 dark:text-white tracking-tighter">
                Jiu-Jitsu <br /> For <span className="text-primary">Everyone</span>
              </h1>
              <p className="text-xl text-slate-700 dark:text-white/80 max-w-lg font-bold uppercase italic tracking-tight leading-relaxed">
                Join the largest and most successful Brazilian Jiu-Jitsu team in the world. Master the art, improve your health, and join our brotherhood.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 px-10 py-8 text-lg font-black uppercase italic tracking-widest rounded-none h-auto shadow-2xl">
                  <Link href="/locator">
                    Find Your School <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Marquee variant="black" />

        {/* Programs Section */}
        <section id="programs" className="py-24 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="space-y-4 border-l-8 border-primary pl-8">
                <h2 className="font-headline text-xs font-black uppercase tracking-[0.4em] text-primary">Inversión Táctica</h2>
                <h3 className="font-headline text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">Desglose de Pagos</h3>
              </div>
              <p className="text-slate-600 dark:text-muted-foreground max-w-sm font-bold uppercase text-[10px] tracking-widest leading-loose">
                Estructura de inversión para unidades operativas. Entrenamiento certificado, ambiente seguro, comunidad global.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-0 border-4 border-slate-900 dark:border-black">
              <ProgramCard 
                title="Plan Semestral"
                level="Ciclo: 6 Meses"
                description="Medium-term tactical commitment. Secure your training cycle with a single payment and tactical bonus."
                details="Inversión Total: $900. Forma de Pago: Un solo pago de $900. Regalo: Uniforme No-Gi."
              />
              <ProgramCard 
                title="Plan Anual"
                level="Ciclo: 12 Meses"
                description="Maximum strategic commitment. Optimize your mission with phased payments and complete equipment deployment."
                details="Inversión Total: $1,800. Forma de Pago: 2 exhibiciones de $900. Regalo: 1 Kimono + Uniforme No-Gi."
                featured
              />
              <ProgramCard 
                title="Pago por Clase"
                level="Ciclo: Por Sesión"
                description="Flexible engagement protocol. Access individual training sessions with official gear rental included."
                details="Costo: $20 cada vez que asistas. Beneficio: Préstamo de uniforme oficial incluido."
              />
            </div>

            <div className="mt-12 p-6 bg-primary/5 border-l-4 border-primary">
              <p className="text-xs font-black uppercase tracking-widest text-primary italic">
                Nota importante: Bajo este esquema, el plan anual es muy atractivo porque, pagando lo mismo que el semestral (en dos partes), el alumno asegura su lugar por más tiempo y recibe el Kimono de regalo.
              </p>
            </div>
          </div>
        </section>

        <Marquee variant="red" />

        {/* Call to Action Reveal Section */}
        <section className="py-32 bg-slate-100 dark:bg-secondary text-slate-900 dark:text-white relative overflow-hidden min-h-[600px] flex items-center border-y-4 border-slate-200 dark:border-border">
          <BackgroundPhotoRotation photoUrls={photos} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl space-y-8 text-left">
              <div className="space-y-4">
                <Badge className="bg-primary text-white font-black uppercase italic tracking-widest rounded-none px-4 border border-white/20">Mission: Join the Legacy</Badge>
                <h2 className="font-headline text-6xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">
                  Establish Your <br />
                  <span className="text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">Presence</span>
                </h2>
                <p className="text-xl text-slate-700 dark:text-white/80 font-bold uppercase italic tracking-tight">
                  Step onto the mats and start your journey with the world's most successful team.
                </p>
              </div>
              <div className="flex gap-4">
                <FreeTrialDialog>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full font-black uppercase italic tracking-tighter w-36 h-36 flex flex-col items-center justify-center text-center leading-none shadow-2xl border-4 border-white/10 transition-transform hover:scale-110 text-lg text-white">
                    FREE<br/>TRIAL
                  </Button>
                </FreeTrialDialog>
              </div>
            </div>
          </div>
          <ScrollRevealImage 
            src="https://graciebarra.com/wp-content/uploads/2025/03/call_to_action-IMG.png"
            alt="Gracie Barra Team Silhouette"
            position="bottom-right"
          />
        </section>

        <Marquee variant="red" />

        {/* Global Reach Section */}
        <section className="py-24 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-center relative overflow-hidden">
          <ScrollRevealImage 
            src="https://graciebarra.com/wp-content/uploads/2025/04/DSC06242bbb_1.png"
            alt="Gracie Barra Team Silhouette"
            position="bottom-left"
            maxWidth="max-w-xl"
          />
          
          <div className="container mx-auto px-4 space-y-12 relative z-10">
            <div className="max-w-3xl mx-auto space-y-4">
              <History className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-headline text-5xl font-black uppercase tracking-tighter italic">One Team. One Shield.</h2>
              <p className="text-xl text-slate-600 dark:text-muted-foreground font-bold uppercase italic tracking-tight">With over 1,000 schools across 6 continents, Academia Pilot brings the Gracie Barra legacy to your neighborhood.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-12 max-w-5xl mx-auto pt-8">
              <div>
                <div className="text-6xl font-black text-primary italic mb-2">1,000+</div>
                <div className="uppercase tracking-[0.3em] text-[10px] font-black text-muted-foreground">Deployed Schools</div>
              </div>
              <div>
                <div className="text-6xl font-black text-primary italic mb-2">35+</div>
                <div className="uppercase tracking-[0.3em] text-[10px] font-black text-muted-foreground">Operational Years</div>
              </div>
              <div>
                <div className="text-6xl font-black text-primary italic mb-2">100k+</div>
                <div className="uppercase tracking-[0.3em] text-[10px] font-black text-muted-foreground">Active Units</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-black text-slate-900 dark:text-white border-t-4 border-primary py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <img 
                    src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                    alt="Gracie Barra Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-headline text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">GRACIE BARRA AI</span>
              </div>
              <p className="text-slate-600 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                Dedicated to the development of Jiu-Jitsu for everyone. Carrying on the legacy through structured teaching and brotherhood.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-primary">Tactical Links</h4>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <li><Link href="#programs" className="hover:text-primary">Programs Matrix</Link></li>
                <li><Link href="/locator" className="hover:text-primary">Coordinate Finder</Link></li>
                <li><Link href="#" className="hover:text-primary">History Registry</Link></li>
                <li><Link href="/store" className="hover:text-primary">Equipment Store</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-primary">Operational</h4>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <li>
                  <AuthModal mode="admin" trigger={<button className="hover:text-primary text-primary">Command Dashboard</button>} />
                </li>
                <li><Link href="#" className="hover:text-primary">Franchise Protocol</Link></li>
                <li><Link href="#" className="hover:text-primary">Support Link</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact Base</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence</h4>
              <p className="text-slate-600 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">Subscribe to receive tactical updates and news.</p>
              <div className="flex border-2 border-slate-300 dark:border-white/10">
                <input type="email" placeholder="UNIT EMAIL..." className="bg-transparent dark:bg-white/5 px-4 py-2 flex-grow text-[10px] font-bold uppercase focus:outline-none focus:bg-slate-100 dark:focus:bg-white/10 text-slate-900 dark:text-white" />
                <Button className="bg-primary hover:bg-primary/90 rounded-none px-6 font-black uppercase italic text-xs text-white">Join</Button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-300 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] text-slate-500 dark:text-white/30 font-black uppercase tracking-[0.2em]">
            <p>© 2024 GRACIE BARRA AI PILOT SYSTEM. MISSION READY.</p>
            <div className="flex gap-8">
              <Link href="/privacy" className="hover:text-primary dark:hover:text-white transition-colors">Privacy Protocol</Link>
              <Link href="/terms" className="hover:text-primary dark:hover:text-white transition-colors">Terms of Engagement</Link>
              <Link href="/taxation" className="hover:text-primary dark:hover:text-white transition-colors">Taxation Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProgramCard({ title, level, description, details, featured = false }: { title: string, level: string, description: string, details: string, featured?: boolean }) {
  return (
    <div className={`p-10 space-y-6 flex flex-col transition-all duration-300 border-r-2 last:border-r-0 border-slate-200 dark:border-black ${featured ? 'bg-slate-100 dark:bg-secondary text-slate-900 dark:text-white scale-105 z-10 shadow-2xl relative' : 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
      <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${featured ? 'text-primary' : 'text-primary'}`}>
        {level}
      </div>
      <h4 className="font-headline text-3xl font-black uppercase italic tracking-tighter leading-none">{title}</h4>
      <p className={`text-sm font-bold uppercase tracking-tight leading-relaxed ${featured ? 'text-slate-600 dark:text-white/80' : 'text-slate-500 dark:text-muted-foreground'}`}>{description}</p>
      <div className="mt-auto pt-8">
        <Button asChild variant={featured ? 'default' : 'outline'} className={`w-full font-black uppercase italic tracking-widest rounded-none h-14 text-xs transition-all ${featured ? 'bg-primary hover:bg-primary/90 border-primary text-white' : 'border-slate-900 dark:border-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-black bg-transparent'}`}>
          <Link href={`/checkout?plan=${encodeURIComponent(title)}&price=${itemPrice(title)}&details=${encodeURIComponent(details)}`}>
            Access Directive
          </Link>
        </Button>
      </div>
    </div>
  );
}

function itemPrice(title: string): string {
  if (title.includes('Semestral')) return '900';
  if (title.includes('Anual')) return '1800';
  return '20';
}
