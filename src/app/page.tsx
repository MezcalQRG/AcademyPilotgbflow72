
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FreeTrialDialog } from '@/components/landing/free-trial-dialog';
import Marquee from '@/components/landing/Marquee';
import { ScrollRevealImage } from '@/components/landing/scroll-reveal-image';
import { 
  Trophy, 
  Users, 
  Shield, 
  ArrowRight, 
  MapPin, 
  History, 
  Zap,
  UserCircle
} from 'lucide-react';

export default function LandingPage() {
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-bjj');
  const classImg = PlaceHolderImages.find(img => img.id === 'jiu-jitsu-class');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-10 w-10 text-primary" />
            <div className="flex flex-col leading-none">
              <span className="font-headline text-2xl font-black uppercase italic text-primary">Academia</span>
              <span className="font-headline text-sm font-bold tracking-widest uppercase text-foreground">Pilot System</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
            <Link href="#programs" className="hover:text-primary transition-colors">Programs</Link>
            <Link href="#philosophy" className="hover:text-primary transition-colors">Philosophy</Link>
            <Link href="/locator" className="hover:text-primary transition-colors">Find a School</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Admin Hub</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="hidden sm:inline-flex font-black uppercase tracking-widest text-[10px] border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-none">
              <Link href="/student/dashboard">
                <UserCircle className="mr-2 h-4 w-4" /> Student Portal
              </Link>
            </Button>
            <FreeTrialDialog>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest px-6 rounded-none">
                Free Trial
              </Button>
            </FreeTrialDialog>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImg?.imageUrl || 'https://picsum.photos/seed/gbhero/1200/800'} 
              alt="Jiu-Jitsu Training" 
              fill 
              className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
              priority
              data-ai-hint="jiu-jitsu training"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-block bg-primary px-4 py-1 text-white text-xs font-black uppercase tracking-[0.3em] italic">
                Organizing the World of Jiu-Jitsu
              </div>
              <h1 className="font-headline text-6xl md:text-8xl font-black leading-none uppercase italic text-white tracking-tighter">
                Jiu-Jitsu <br /> For <span className="text-primary">Everyone</span>
              </h1>
              <p className="text-xl text-white/80 max-w-lg font-medium leading-relaxed">
                Join the largest and most successful Brazilian Jiu-Jitsu team in the world. Master the art, improve your health, and join our brotherhood.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 px-10 py-8 text-lg font-black uppercase tracking-widest rounded-none h-auto">
                  <Link href="/locator">
                    Find Your School <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-10 py-8 text-lg font-black uppercase tracking-widest rounded-none h-auto bg-transparent">
                  Our Legacy
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Marquee />

        {/* Programs Section */}
        <section id="programs" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="space-y-4">
                <h2 className="font-headline text-sm font-black uppercase tracking-[0.4em] text-primary">Master the Art</h2>
                <h3 className="font-headline text-5xl font-black uppercase tracking-tighter italic">Our Programs</h3>
              </div>
              <p className="text-muted-foreground max-w-md font-medium">
                We offer structured programs for all ages and skill levels, ensuring a safe and productive learning environment.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-0 border border-border">
              <ProgramCard 
                title="GB¹ Fundamentals"
                level="Beginner"
                description="Designed for people with no martial arts experience. Build a strong foundation of BJJ basics."
              />
              <ProgramCard 
                title="GB² Advanced"
                level="Intermediate"
                description="Take your training to the next level with more complex techniques and live sparring."
                featured
              />
              <ProgramCard 
                title="GB³ Black Belt"
                level="Elite"
                description="The ultimate expression of our system. Deep dive into the philosophy and advanced techniques."
              />
            </div>
          </div>
        </section>

        <Marquee />

        {/* Call to Action Reveal Section */}
        <section className="py-32 bg-secondary/5 relative overflow-hidden min-h-[600px] flex items-center">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl space-y-8 text-left">
              <div className="space-y-4">
                <Badge className="bg-primary text-white font-black uppercase italic tracking-widest rounded-none px-4">Mission: Join the Legacy</Badge>
                <h2 className="font-headline text-6xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                  Establish Your <br />
                  <span className="text-primary">Presence</span>
                </h2>
                <p className="text-xl text-muted-foreground font-bold uppercase italic tracking-tight">
                  Step onto the mats and start your journey with the world's most successful team.
                </p>
              </div>
              <div className="flex gap-4">
                <FreeTrialDialog>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-none font-black uppercase italic tracking-widest h-16 px-10">
                    Request Trial Link
                  </Button>
                </FreeTrialDialog>
              </div>
            </div>
          </div>
          {/* Silhouette pinned to bottom right */}
          <ScrollRevealImage 
            src="https://graciebarra.com/wp-content/uploads/2025/03/call_to_action-IMG.png"
            alt="Gracie Barra Team Silhouette"
            position="bottom-right"
          />
        </section>

        <Marquee />

        {/* Core Values */}
        <section id="philosophy" className="py-24 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-square">
                <div className="absolute -top-4 -left-4 w-full h-full border-4 border-primary z-0" />
                <Image 
                  src={classImg?.imageUrl || 'https://picsum.photos/seed/gbclass/800/600'} 
                  alt="Training Philosophy" 
                  fill 
                  className="object-cover relative z-10 shadow-2xl"
                  data-ai-hint="martial arts class"
                />
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="font-headline text-sm font-black uppercase tracking-[0.4em] text-primary">The GB Way</h2>
                  <h3 className="font-headline text-5xl font-black uppercase tracking-tighter italic leading-none">Philosophy & Heritage</h3>
                </div>
                
                <div className="grid gap-8">
                  <ValueItem icon={<Shield />} title="Safety First" description="We prioritize the physical and mental well-being of every student." />
                  <ValueItem icon={<Users />} title="Brotherhood" description="Build lifelong friendships on and off the mats with our global community." />
                  <ValueItem icon={<Trophy />} title="Excellence" description="Pursue the highest standards of technique and character development." />
                </div>

                <Button variant="link" className="p-0 h-auto text-primary font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  Read Our Full Philosophy <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Marquee />

        {/* Global Reach Section */}
        <section className="py-24 bg-black text-white text-center relative overflow-hidden">
          {/* Master silhouette revealed from bottom-left */}
          <ScrollRevealImage 
            src="https://graciebarra.com/wp-content/uploads/2025/04/DSC06242bbb_1.png"
            alt="Gracie Barra Master Silhouette"
            position="bottom-left"
            maxWidth="max-w-xl"
          />
          
          <div className="container mx-auto px-4 space-y-12 relative z-10">
            <div className="max-w-3xl mx-auto space-y-4">
              <History className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-headline text-5xl font-black uppercase tracking-tighter italic">One Team. One Shield.</h2>
              <p className="text-xl text-white/60">With over 1,000 schools across 6 continents, Academia Pilot brings the Gracie Barra legacy to your neighborhood.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-12 max-w-5xl mx-auto pt-8">
              <div>
                <div className="text-6xl font-black text-primary italic mb-2">1,000+</div>
                <div className="uppercase tracking-[0.3em] text-xs font-bold text-white/40">Global Schools</div>
              </div>
              <div>
                <div className="text-6xl font-black text-primary italic mb-2">35+</div>
                <div className="uppercase tracking-[0.3em] text-xs font-bold text-white/40">Years of History</div>
              </div>
              <div>
                <div className="text-6xl font-black text-primary italic mb-2">100k+</div>
                <div className="uppercase tracking-[0.3em] text-xs font-bold text-white/40">Active Students</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-white/10 py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-black tracking-tighter uppercase italic">Academia</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Dedicated to the development of Jiu-Jitsu for everyone. Carrying on the legacy through structured teaching and strong community values.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline text-sm font-black uppercase tracking-widest">Explore</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link href="#" className="hover:text-primary">Programs</Link></li>
                <li><Link href="#" className="hover:text-primary">Instructors</Link></li>
                <li><Link href="#" className="hover:text-primary">History</Link></li>
                <li><Link href="#" className="hover:text-primary">Uniforms</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline text-sm font-black uppercase tracking-widest">Connect</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link href="/locator" className="hover:text-primary">Find a School</Link></li>
                <li><Link href="#" className="hover:text-primary">Franchising</Link></li>
                <li><Link href="#" className="hover:text-primary">Support</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline text-sm font-black uppercase tracking-widest">Newsletter</h4>
              <p className="text-white/40 text-sm">Stay updated with the latest news and techniques.</p>
              <div className="flex">
                <input type="email" placeholder="Email Address" className="bg-white/5 border border-white/10 px-4 py-2 flex-grow text-sm focus:outline-none focus:border-primary" />
                <Button className="bg-primary hover:bg-primary/90 rounded-none px-4">Join</Button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/30 font-bold uppercase tracking-widest">
            <p>© 2024 Academia Pilot System. All Rights Reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-white">Privacy</Link>
              <Link href="#" className="hover:text-white">Terms</Link>
              <Link href="#" className="hover:text-white">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProgramCard({ title, level, description, featured = false }: { title: string, level: string, description: string, featured?: boolean }) {
  return (
    <div className={`p-10 space-y-6 flex flex-col transition-all duration-300 ${featured ? 'bg-primary text-white scale-105 z-10 shadow-2xl' : 'bg-white text-black hover:bg-muted'}`}>
      <div className={`text-xs font-black uppercase tracking-[0.3em] ${featured ? 'text-white/70' : 'text-primary'}`}>
        {level}
      </div>
      <h4 className="font-headline text-3xl font-black uppercase italic tracking-tighter leading-none">{title}</h4>
      <p className={`font-medium ${featured ? 'text-white/80' : 'text-muted-foreground'}`}>{description}</p>
      <div className="mt-auto pt-6">
        <Button variant={featured ? 'secondary' : 'outline'} className={`w-full font-black uppercase tracking-widest rounded-none h-12 ${!featured && 'border-black hover:bg-black hover:text-white bg-transparent'}`}>
          Details
        </Button>
      </div>
    </div>
  );
}

function ValueItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="mt-1 h-14 w-14 flex-shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded-none group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="font-headline text-xl font-black uppercase italic tracking-tight">{title}</h4>
        <p className="text-muted-foreground font-medium leading-tight">{description}</p>
      </div>
    </div>
  );
}
