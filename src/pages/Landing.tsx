import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import kartlyLogo from '@/assets/kartly-logo.png';

const features = [
  {
    icon: Upload,
    title: 'Multi-Platform Upload',
    description: 'Upload CSV files from Amazon, Flipkart, and Meesho in one place.',
  },
  {
    icon: BarChart3,
    title: 'Unified Dashboard',
    description: 'View all your sales data in a single, beautiful dashboard.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Smart Reports',
    description: 'Export detailed reports to PDF and Excel with one click.',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Analytics',
    description: 'Track revenue, profits, and trends across all platforms.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and only accessible to you.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process thousands of orders in seconds.',
  },
];

const benefits = [
  'No more scattered spreadsheets',
  'Automatic data normalization',
  'Date-wise filtering & search',
  'Marketplace comparison insights',
  'Professional export formats',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={kartlyLogo} alt="Kartly" className="h-11 w-auto" />
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Unified E-Commerce Analytics</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 animate-fade-in">
            Turn Scattered CSV Reports Into{' '}
            <span className="text-accent">Clear Business Insights</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
            Upload sales data from Amazon, Flipkart, and Meesho. View everything in one dashboard. Make smarter decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all px-8">
                Start Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Marketplace badges */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amazon/10 text-amazon">
              <span className="font-semibold">Amazon</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-flipkart/10 text-flipkart">
              <span className="font-semibold">Flipkart</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-meesho/10 text-meesho">
              <span className="font-semibold">Meesho</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed specifically for multi-platform e-commerce sellers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Stop Wasting Time on Spreadsheets
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Managing multiple e-commerce platforms means juggling different CSV formats, 
                column names, and reports. Kartly normalizes everything automatically.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 gradient-primary opacity-10 blur-3xl rounded-3xl" />
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-xl">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-secondary/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                      <div className="text-2xl font-bold text-foreground">₹4,52,340</div>
                    </div>
                    <div className="flex-1 p-4 bg-secondary/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Orders</div>
                      <div className="text-2xl font-bold text-foreground">1,247</div>
                    </div>
                  </div>
                  <div className="h-32 bg-secondary/30 rounded-lg flex items-end justify-around p-4">
                    <div className="w-8 bg-amazon/80 rounded-t" style={{ height: '60%' }} />
                    <div className="w-8 bg-flipkart/80 rounded-t" style={{ height: '80%' }} />
                    <div className="w-8 bg-meesho/80 rounded-t" style={{ height: '45%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="gradient-hero rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Ready to Simplify Your Analytics?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of sellers who save hours every week with Kartly.
              </p>
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="px-8 shadow-lg">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={kartlyLogo} alt="Kartly" className="h-7 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kartly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
