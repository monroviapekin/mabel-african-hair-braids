import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp, 
  doc, 
  getDoc, 
  setDoc,
  orderBy
} from 'firebase/firestore';
import { 
  Menu, 
  X, 
  Calendar, 
  Image as ImageIcon, 
  Phone, 
  User, 
  LogOut, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Instagram, 
  Facebook, 
  Scissors,
  CheckCircle2,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  Shield,
  Mail,
  Upload,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isAfter, isBefore, parseISO } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { auth, db, storage, facebookProvider, OperationType, handleFirestoreError } from './firebase';
import { UserProfile, Appointment, Service, GalleryImage } from './types';
import { cn } from './lib/utils';

// --- Components ---

const ImageUpload = ({ 
  folder, 
  onUploadComplete, 
  label = "Upload Image",
  className = ""
}: { 
  folder: string, 
  onUploadComplete: (url: string) => void, 
  label?: string,
  className?: string
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      }, 
      (error) => {
        console.error('Upload error:', error);
        toast.error('Upload failed. Please try again.');
        setUploading(false);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          onUploadComplete(downloadURL);
          setUploading(false);
          setProgress(0);
          toast.success('Upload successful!');
        });
      }
    );
  };

  return (
    <div className={cn("relative", className)}>
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-yellow-200 rounded-2xl cursor-pointer hover:bg-yellow-50 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-yellow-900 rounded-full animate-spin mb-2" />
              <p className="text-xs text-yellow-800 font-bold">{Math.round(progress)}%</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-yellow-600 mb-2" />
              <p className="text-sm text-yellow-800 font-bold">{label}</p>
              <p className="text-xs text-yellow-800/60 mt-1">PNG, JPG up to 5MB</p>
            </>
          )}
        </div>
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
      </label>
    </div>
  );
};

const Navbar = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Meet Mabel', path: '/meet-mabel' },
    { name: 'Services', path: '/services' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Book Now', path: '/book' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out.');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Scissors className="text-yellow-900 w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-yellow-900 font-serif italic">Mabel African Braids</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-yellow-600",
                  location.pathname === link.path ? "text-yellow-600 border-b-2 border-yellow-400" : "text-yellow-800"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-full hover:bg-yellow-200 transition-colors">
                  <User className="w-4 h-4 text-yellow-800" />
                  <span className="text-sm font-bold text-yellow-900">Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-bold text-yellow-900 hover:text-yellow-600"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-yellow-900 text-yellow-50 px-6 py-2 rounded-full text-sm font-bold hover:bg-yellow-800 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-yellow-900 p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-yellow-50 border-b border-yellow-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-yellow-900 hover:bg-yellow-100 rounded-lg"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 text-base font-medium text-yellow-900 hover:bg-yellow-100 rounded-lg"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="w-full text-left px-3 py-4 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-4 border-t border-yellow-100">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 text-base font-medium text-yellow-900 hover:bg-yellow-100 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 text-base font-medium bg-yellow-900 text-yellow-50 rounded-lg text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-yellow-900 text-yellow-50 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-serif italic mb-4">Mabel African Braids</h3>
          <p className="text-yellow-200/80 leading-relaxed max-w-md">
            Professional hair braiding and locs services in a warm, welcoming environment. 
            We celebrate your beauty with every strand.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-widest text-sm text-yellow-400">Visit Us</h4>
          <address className="not-italic text-yellow-200/80 space-y-2">
            <p>6472 21St St S</p>
            <p>Fargo, ND 58104</p>
            <div className="pt-2 space-y-2">
              <a href="tel:7012198120" className="flex items-center hover:text-yellow-400 transition-colors">
                <Phone className="w-4 h-4 mr-2" /> 701-219-8120
              </a>
              <a href="mailto:mabelhairbraiding@yahoo.com" className="flex items-center hover:text-yellow-400 transition-colors">
                <Mail className="w-4 h-4 mr-2" /> mabelhairbraiding@yahoo.com
              </a>
            </div>
          </address>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-widest text-sm text-yellow-400">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/meet-mabel" className="hover:text-yellow-400 transition-colors">Meet Mabel</Link></li>
            <li><Link to="/services" className="hover:text-yellow-400 transition-colors">Services</Link></li>
            <li><Link to="/gallery" className="hover:text-yellow-400 transition-colors">Gallery</Link></li>
            <li><Link to="/book" className="hover:text-yellow-400 transition-colors">Book Appointment</Link></li>
            <li><Link to="/contact" className="hover:text-yellow-400 transition-colors">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-yellow-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex space-x-4">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-yellow-800 rounded-full hover:bg-yellow-700 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://www.facebook.com/mabel.white.125" target="_blank" rel="noopener noreferrer" className="p-2 bg-yellow-800 rounded-full hover:bg-yellow-700 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
          <span className="text-xs text-yellow-500/50 hidden md:block">|</span>
          <p className="text-sm text-yellow-100 font-medium">
            Built by <span className="text-yellow-400 font-bold">Peter Varkpeh Cooper</span>, Software Engineer
          </p>
        </div>
        <p className="text-sm text-yellow-200/60">
          &copy; {new Date().getFullYear()} Mabel African Braids and Locs. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// --- Pages ---

const Home = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-stone-50">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Professional Hair Artistry
            </span>
            <h1 className="text-6xl md:text-8xl font-serif italic text-yellow-900 leading-tight mb-8">
              Elegance in Every <span className="text-yellow-600">Braid</span>
            </h1>
            <p className="text-xl text-yellow-800/80 mb-10 leading-relaxed">
              Experience the artistry of traditional and modern African hair braiding. 
              From intricate cornrows to majestic locs, we bring your beauty to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book" className="bg-yellow-900 text-yellow-50 px-8 py-4 rounded-full font-bold hover:bg-yellow-800 transition-all shadow-lg flex items-center justify-center">
                Book Appointment <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/gallery" className="bg-white border border-yellow-200 text-yellow-900 px-8 py-4 rounded-full font-bold hover:bg-yellow-50 transition-all flex items-center justify-center">
                View Gallery
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Clock />, title: "Flexible Hours", desc: "We work around your schedule to ensure you get the time you need." },
            { icon: <Scissors />, title: "Expert Stylists", desc: "Years of experience in all types of braids, locs, and twists." },
            { icon: <CheckCircle2 />, title: "Quality Results", desc: "We use premium products to ensure your hair stays healthy and beautiful." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-yellow-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-yellow-900 mb-4">{feature.title}</h3>
              <p className="text-yellow-800/70 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Signature Styles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif italic text-yellow-900 mb-4">Signature Styles</h2>
          <p className="text-yellow-800/60 max-w-2xl mx-auto">
            Discover the artistry and tradition behind our most popular hair styles.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { url: "https://storage.googleapis.com/cooper-dev-projects-2026/mabel-african-hairbraids-2026/braids10.jpg.jpg", title: "Box Braids" },
            { url: "https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&q=80&w=800", title: "Cornrows" },
            { url: "https://storage.googleapis.com/cooper-dev-projects-2026/mabel-african-hairbraids-2026/cornrow.jpg.jpg", title: "Intricate Cornrows" },
            { url: "https://storage.googleapis.com/cooper-dev-projects-2026/mabel-african-hairbraids-2026/thread.jpg.jpg", title: "African Threading" }
          ].map((style, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-lg"
            >
              <img 
                src={style.url} 
                alt={style.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-yellow-50 font-bold text-xl">{style.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-yellow-400 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500 rounded-full -ml-32 -mb-32 blur-3xl opacity-30" />
          
          <h2 className="text-4xl md:text-5xl font-serif italic text-yellow-900 mb-8 relative z-10">
            Ready for a new look?
          </h2>
          <p className="text-lg text-yellow-900/80 mb-10 max-w-2xl mx-auto relative z-10">
            Join hundreds of satisfied clients who trust Mabel for their hair care needs. 
            Book your consultation today.
          </p>
          <Link to="/book" className="inline-block bg-yellow-900 text-yellow-50 px-10 py-4 rounded-full font-bold hover:bg-yellow-800 transition-all shadow-xl relative z-10">
            Secure Your Spot
          </Link>
        </div>
      </section>
    </div>
  );
};

const Services = () => {
  const services: Service[] = [
    { id: '1', name: 'Box Braids', description: 'Classic individual braids that offer versatility and protection. Available in various sizes and lengths.', priceRange: '$150 - $300', category: 'Braids' },
    { id: '2', name: 'Knotless Braids', description: 'A modern, tension-free technique that starts with your natural hair for a seamless, lightweight look.', priceRange: '$180 - $350', category: 'Braids' },
    { id: '3', name: 'Cornrows', description: 'Intricate patterns braided close to the scalp. Perfect for a clean, low-maintenance style.', priceRange: '$60 - $150', category: 'Braids' },
    { id: '4', name: 'Dreadlocks Installation', description: 'Start your loc journey with professional sectioning and twisting techniques tailored to your hair type.', priceRange: '$200 - $500', category: 'Locs' },
    { id: '5', name: 'Loc Retwist & Style', description: 'Maintain your locs with a thorough wash, retwist, and a creative style of your choice.', priceRange: '$80 - $180', category: 'Locs' },
    { id: '6', name: 'Senegalese Twists', description: 'Sleek, rope-like twists using high-quality extensions for a sophisticated finish.', priceRange: '$160 - $280', category: 'Twists' },
    { id: '7', name: 'Passion Twists', description: 'Bohemian-style twists with a curly, textured finish for a soft and romantic look.', priceRange: '$170 - $300', category: 'Twists' },
    { id: '8', name: 'Goddess Braids', description: 'Thick, beautiful cornrows that can be styled into elegant updos or left flowing.', priceRange: '$80 - $160', category: 'Braids' },
    { id: '9', name: 'Faux Locs', description: 'Get the loc look without the long-term commitment. Temporary and stylish.', priceRange: '$180 - $320', category: 'Locs' },
    { id: '10', name: 'Take Down & Treatment', description: 'Gentle removal of braids or twists followed by a deep conditioning treatment.', priceRange: '$50 - $100', category: 'Other' },
    { id: '11', name: 'Single Braids', description: 'Traditional individual braids for a neat and long-lasting protective style.', priceRange: '$140 - $280', category: 'Braids' },
    { id: '12', name: 'Sisterlocs', description: 'Tiny, uniform locs created using a specialized tool. A beautiful and versatile natural hair option.', priceRange: '$500 - $1200', category: 'Locs' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-20">
        <h2 className="text-5xl font-serif italic text-yellow-900 mb-6">Our Services</h2>
        <p className="text-yellow-800/70 max-w-2xl mx-auto text-lg">
          We offer a wide range of professional hair services tailored to your unique style and hair needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service, i) => (
          <motion.div 
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-8 rounded-3xl border border-yellow-100 flex flex-col justify-between hover:border-yellow-300 transition-colors group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-yellow-900">{service.name}</h3>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {service.category}
                </span>
              </div>
              <p className="text-yellow-800/70 mb-6 leading-relaxed">{service.description}</p>
            </div>
            <div className="flex justify-between items-center pt-6 border-t border-yellow-50">
              <span className="text-lg font-bold text-yellow-600">{service.priceRange}</span>
              <Link to="/book" className="text-yellow-900 font-bold flex items-center hover:text-yellow-600 transition-colors">
                Book <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Gallery = ({ isAdmin }: { isAdmin: boolean }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('Braids');

  const portfolioImages: GalleryImage[] = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: `portfolio-${i + 1}`,
      url: `https://storage.googleapis.com/cooper-dev-projects-2026/mabel-african-hairbraids-2026/braids${i + 1}.jpg.jpg`,
      title: `Classic Style ${i + 1}`,
      category: (i < 10) ? 'Braids' : (i < 16) ? 'Locs' : 'Twists' // Fixed distribution
    }));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
      setImages(imgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });

    return () => unsubscribe();
  }, []);

  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Braids', 'Locs', 'Twists'];

  const filteredImages = useMemo(() => {
    const allImages = [...portfolioImages, ...images];
    if (filter === 'All') return allImages;
    return allImages.filter(img => img.category === filter);
  }, [filter, images, portfolioImages]);

  const handleGalleryUpload = async (url: string) => {
    if (!newImageTitle) {
      toast.error('Please provide a title for the image.');
      return;
    }
    try {
      await addDoc(collection(db, 'gallery'), {
        url,
        title: newImageTitle,
        category: newImageCategory,
        createdAt: Timestamp.now()
      });
      setShowUpload(false);
      setNewImageTitle('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save gallery image.');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      toast.success('Image deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete image.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-serif italic text-yellow-900 mb-6">Style Gallery</h2>
        <p className="text-yellow-800/70 max-w-2xl mx-auto text-lg mb-10">
          Browse through our collection of beautiful transformations and find your next inspiration.
        </p>
        
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all",
                  filter === cat 
                    ? "bg-yellow-400 text-yellow-900 shadow-md" 
                    : "bg-white text-yellow-800 border border-yellow-100 hover:bg-yellow-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="w-full max-w-md">
              <button 
                onClick={() => setShowUpload(!showUpload)}
                className="bg-yellow-900 text-yellow-50 px-6 py-2 rounded-full text-sm font-bold hover:bg-yellow-800 transition-colors flex items-center mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> {showUpload ? 'Cancel Upload' : 'Add New Style'}
              </button>

              <AnimatePresence>
                {showUpload && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 bg-white p-6 rounded-3xl border border-yellow-100 shadow-lg space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-yellow-900 uppercase tracking-widest">Style Title</label>
                      <input 
                        type="text" 
                        value={newImageTitle}
                        onChange={(e) => setNewImageTitle(e.target.value)}
                        placeholder="e.g. Bohemian Box Braids"
                        className="w-full p-3 rounded-xl border border-yellow-100 focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-yellow-900 uppercase tracking-widest">Category</label>
                      <select 
                        value={newImageCategory}
                        onChange={(e) => setNewImageCategory(e.target.value)}
                        className="w-full p-3 rounded-xl border border-yellow-100 focus:ring-2 focus:ring-yellow-400 outline-none"
                      >
                        {categories.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <ImageUpload 
                      folder="gallery" 
                      onUploadComplete={handleGalleryUpload}
                      label="Upload Style Photo"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-yellow-800/40">Loading gallery...</div>
      ) : filteredImages.length === 0 ? (
        <div className="py-20 text-center text-yellow-800/60 bg-white rounded-3xl border border-dashed border-yellow-200">
          No images found in this category.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          <AnimatePresence mode='popLayout'>
            {filteredImages.map((img) => (
              <motion.div
                layout
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group rounded-3xl overflow-hidden shadow-sm"
              >
                <img 
                  src={img.url} 
                  alt={img.title} 
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">{img.category}</span>
                  <h4 className="text-white font-bold text-lg">{img.title}</h4>
                  {isAdmin && !img.id.startsWith('portfolio-') && (
                    <button 
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-4 right-4 p-2 bg-red-600/80 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const Booking = ({ user }: { user: any }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStylist, setSelectedStylist] = useState<string>('Next Available');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const services = [
    'Box Braids', 'Single Braids', 'Sisterlocs', 'Knotless Braids', 'Cornrows', 'Dreadlocks Installation', 
    'Loc Retwist', 'Senegalese Twists', 'Passion Twists', 'Goddess Braids'
  ];

  const stylists = ['Next Available', 'Mabel', 'Sarah', 'Jane'];

  const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book an appointment.');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        userId: user.uid,
        serviceId: selectedService.toLowerCase().replace(/\s+/g, '-'),
        serviceName: selectedService,
        stylist: selectedStylist,
        date: Timestamp.fromDate(new Date(`${selectedDate}T${selectedTime}`)),
        status: 'pending',
        notes,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);

      // Send to Formspree
      const response = await fetch('https://formspree.io/f/xeevpgaq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: user.displayName || 'Customer',
          email: user.email,
          subject: 'New Appointment Request from website',
          message: `New Appointment Request:
Service: ${selectedService}
Date: ${format(parseISO(selectedDate), 'MMM do, yyyy')}
Time: ${selectedTime}
Stylist: ${selectedStylist}
Notes: ${notes || 'None'}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification to business.');
      }

      toast.success('Appointment requested! We will confirm shortly.');
      setStep(4);
    } catch (error: any) {
      console.error('Booking Error:', error);
      const errorMessage = error?.text || error?.message || 'Failed to book appointment.';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user && step < 4) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
          <User className="text-yellow-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif italic text-yellow-900 mb-4">Sign In to Book</h2>
        <p className="text-yellow-800/70 mb-8">You need to be logged in to schedule an appointment and track your bookings.</p>
        <button 
          onClick={() => signInWithPopup(auth, facebookProvider)}
          className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center mx-auto"
        >
          <Facebook className="w-5 h-5 mr-2" />
          Sign In with Facebook
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="bg-white rounded-[2.5rem] border border-yellow-100 shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-yellow-50 h-2 flex">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "flex-1 transition-all duration-500",
                step >= i ? "bg-yellow-400" : "bg-transparent"
              )} 
            />
          ))}
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-serif italic text-yellow-900 mb-8">Select a Service</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(service => (
                  <button
                    key={service}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className={cn(
                      "p-6 text-left rounded-2xl border transition-all",
                      selectedService === service 
                        ? "bg-yellow-400 border-yellow-400 text-yellow-900 shadow-md" 
                        : "bg-white border-yellow-100 text-yellow-800 hover:border-yellow-300"
                    )}
                  >
                    <div className="font-bold">{service}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <button onClick={() => setStep(1)} className="text-yellow-600 font-bold text-sm mb-6 flex items-center">
                <ChevronRight className="rotate-180 w-4 h-4 mr-1" /> Back to Services
              </button>
              <h2 className="text-3xl font-serif italic text-yellow-900 mb-8">Choose Date & Time</h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-yellow-900 mb-4 uppercase tracking-widest">Select Date</label>
                  <input 
                    type="date" 
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-yellow-900 mb-4 uppercase tracking-widest">Select Time</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {times.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-bold transition-all",
                          selectedTime === t 
                            ? "bg-yellow-400 border-yellow-400 text-yellow-900 shadow-md" 
                            : "bg-white border-yellow-100 text-yellow-800 hover:border-yellow-300"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                  className="w-full bg-yellow-900 text-yellow-50 py-4 rounded-xl font-bold hover:bg-yellow-800 transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <button onClick={() => setStep(2)} className="text-yellow-600 font-bold text-sm mb-6 flex items-center">
                <ChevronRight className="rotate-180 w-4 h-4 mr-1" /> Back to Date & Time
              </button>
              <h2 className="text-3xl font-serif italic text-yellow-900 mb-8">Final Details</h2>
              
              <div className="bg-yellow-50 p-6 rounded-2xl mb-8 border border-yellow-100">
                <div className="flex justify-between mb-2">
                  <span className="text-yellow-800/60 text-sm">Service</span>
                  <span className="font-bold text-yellow-900">{selectedService}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-yellow-800/60 text-sm">Stylist</span>
                  <span className="font-bold text-yellow-900">{selectedStylist}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-yellow-800/60 text-sm">Date</span>
                  <span className="font-bold text-yellow-900">{format(parseISO(selectedDate), 'MMMM do, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-800/60 text-sm">Time</span>
                  <span className="font-bold text-yellow-900">{selectedTime}</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-yellow-900 mb-4 uppercase tracking-widest">Preferred Stylist</label>
                <div className="grid grid-cols-2 gap-3">
                  {stylists.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedStylist(s)}
                      className={cn(
                        "py-3 rounded-xl border text-sm font-bold transition-all",
                        selectedStylist === s 
                          ? "bg-yellow-400 border-yellow-400 text-yellow-900 shadow-md" 
                          : "bg-white border-yellow-100 text-yellow-800 hover:border-yellow-300"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-yellow-900 mb-2 uppercase tracking-widest">Notes (Optional)</label>
                <textarea 
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific requests or hair details..."
                  className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleBooking}
                className="w-full bg-yellow-900 text-yellow-50 py-4 rounded-xl font-bold hover:bg-yellow-800 transition-all flex items-center justify-center"
              >
                {loading ? "Processing..." : "Confirm Booking Request"}
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-600 w-10 h-10" />
              </div>
              <h2 className="text-3xl font-serif italic text-yellow-900 mb-4">Booking Requested!</h2>
              <p className="text-yellow-800/70 mb-10">
                Thank you for choosing Mabel. We've received your request and will send a confirmation email shortly.
              </p>
              <Link to="/dashboard" className="inline-block bg-yellow-400 text-yellow-900 px-10 py-4 rounded-full font-bold hover:bg-yellow-500 transition-all shadow-lg">
                View My Appointments
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = profile?.role === 'admin';

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
      toast.success(`Appointment ${status}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status.');
    }
  };

  const handleRoleUpdate = async (uid: string, newRole: 'admin' | 'client') => {
    if (uid === user.uid) {
      toast.error("You cannot change your own role.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      toast.success(`User role updated to ${newRole}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update user role.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await deleteDoc(doc(db, 'appointments', id));
      toast.success('Appointment deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete appointment.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      toast.success('Message deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete message.');
    }
  };

  useEffect(() => {
    if (!user) return;

    const appointmentsQuery = isAdmin 
      ? query(collection(db, 'appointments'), orderBy('date', 'desc'))
      : query(collection(db, 'appointments'), where('userId', '==', user.uid), orderBy('date', 'desc'));

    const unsubscribeApps = onSnapshot(appointmentsQuery, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(apps);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    });

    let unsubscribeMessages: any = () => {};
    let unsubscribeUsers: any = () => {};
    if (isAdmin) {
      const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      });

      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const userList = snapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(userList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
    }

    return () => {
      unsubscribeApps();
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, [user, isAdmin]);

  if (!user) return <div className="py-20 text-center">Please sign in to view your dashboard.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-serif italic text-yellow-900 mb-2">
            {isAdmin ? 'Admin Dashboard' : `Welcome, ${user.displayName?.split(' ')[0] || 'User'}`}
          </h2>
          <p className="text-yellow-800/60">
            {isAdmin ? 'Manage all appointments and messages.' : 'Manage your hair care journey and upcoming appointments.'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/book" className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-500 transition-all shadow-md flex items-center">
            <Plus className="w-5 h-5 mr-2" /> New Booking
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-yellow-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-yellow-600" /> 
              {isAdmin ? 'All Appointments' : 'My Appointments'}
            </h3>
            
            {loading ? (
              <div className="py-10 text-center text-yellow-800/40">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-yellow-200 text-center">
                <p className="text-yellow-800/60 mb-6">No appointments found.</p>
                {!isAdmin && <Link to="/book" className="text-yellow-600 font-bold hover:underline">Book your first style now</Link>}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((app) => (
                  <motion.div 
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-2xl border border-yellow-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                        <Scissors className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-900">{app.serviceName}</h4>
                        <div className="flex items-center text-sm text-yellow-800/60 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(app.date.toDate(), 'MMM do, yyyy @ h:mm a')}
                        </div>
                        {isAdmin && <p className="text-xs text-yellow-700 mt-1">Stylist: {app.stylist}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        app.status === 'confirmed' ? "bg-green-100 text-green-700" :
                        app.status === 'cancelled' ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {app.status}
                      </span>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(app.id, 'confirmed')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteAppointment(app.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {isAdmin && (
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-yellow-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-yellow-600" /> Customer Messages
              </h3>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-dashed border-yellow-200 text-center text-yellow-800/60">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-white p-6 rounded-2xl border border-yellow-100 shadow-sm group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-yellow-900">{msg.name}</h4>
                          <p className="text-sm text-yellow-600">{msg.email}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-yellow-800/40">
                            {format(msg.createdAt.toDate(), 'MMM do, h:mm a')}
                          </span>
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-yellow-800/80 text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {isAdmin && (
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-yellow-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-yellow-600" /> User Management
              </h3>
              <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-yellow-50 border-b border-yellow-100">
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-yellow-900">User</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-yellow-900">Email</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-yellow-900">Role</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-yellow-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.uid} className="border-b border-yellow-50 hover:bg-yellow-50/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xs">
                                  {u.displayName?.[0] || u.email?.[0].toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-yellow-900 text-sm">{u.displayName || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-yellow-800/60">{u.email}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <select 
                              value={u.role}
                              disabled={u.uid === user.uid}
                              onChange={(e) => handleRoleUpdate(u.uid, e.target.value as 'admin' | 'client')}
                              className="text-xs bg-white border border-yellow-200 rounded-lg p-1 outline-none focus:ring-1 focus:ring-yellow-400 disabled:opacity-50"
                            >
                              <option value="client">Client</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-yellow-900 text-yellow-50 p-8 rounded-3xl shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-yellow-400" /> Profile Info
            </h3>
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative group">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-yellow-800 flex items-center justify-center text-yellow-400 font-bold text-2xl border-2 border-yellow-400">
                    {user.displayName?.[0] || user.email?.[0].toUpperCase()}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const storageRef = ref(storage, `profiles/${user.uid}`);
                      const uploadTask = uploadBytesResumable(storageRef, file);
                      
                      toast.promise(
                        new Promise((resolve, reject) => {
                          uploadTask.on('state_changed', null, reject, async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            await updateProfile(user, { photoURL: url });
                            await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
                            resolve(url);
                          });
                        }),
                        {
                          loading: 'Uploading profile picture...',
                          success: 'Profile picture updated!',
                          error: 'Failed to upload profile picture.'
                        }
                      );
                    }}
                  />
                </label>
              </div>
              <div>
                <p className="font-bold text-lg">{user.displayName || 'User'}</p>
                <p className="text-yellow-200/60 text-sm">{user.email}</p>
                <p className="text-yellow-400 text-xs font-bold uppercase mt-1">{profile?.role}</p>
              </div>
            </div>
            <button className="w-full py-3 bg-yellow-800 hover:bg-yellow-700 rounded-xl text-sm font-bold transition-colors">
              Edit Profile
            </button>
          </div>

          {!isAdmin && (
            <div className="bg-white p-8 rounded-3xl border border-yellow-100">
              <h3 className="text-lg font-bold text-yellow-900 mb-4">Need Help?</h3>
              <p className="text-yellow-800/70 text-sm mb-6 leading-relaxed">
                If you need to reschedule or have questions about your style, please contact us directly.
              </p>
              <Link to="/contact" className="flex items-center text-yellow-600 font-bold hover:underline">
                Contact Support <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, 'messages'), {
        name,
        email,
        message,
        createdAt: Timestamp.now()
      });

      // Send to Formspree
      const response = await fetch('https://formspree.io/f/xeevpgaq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          subject: 'New Contact Message from website',
          message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message to business.');
      }

      toast.success('Message sent! We will get back to you shortly.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error: any) {
      console.error('Detailed Error:', error);
      const errorMessage = error?.text || error?.message || 'Failed to send message.';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-20">
        <h2 className="text-5xl font-serif italic text-yellow-900 mb-6">Get in Touch</h2>
        <p className="text-yellow-800/70 max-w-2xl mx-auto text-lg">
          Have a question or want to discuss a custom style? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-12">
          <div className="flex items-start space-x-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-yellow-900 mb-2">Call or Text</h4>
              <a href="tel:7012198120" className="text-yellow-800/70 text-lg hover:text-yellow-600 transition-colors block">701-219-8120</a>
              <p className="text-yellow-800/50 text-sm mt-1">Available Mon-Sat, 9am-6pm</p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-yellow-900 mb-2">Visit Our Studio</h4>
              <p className="text-yellow-800/70 text-lg">6472 21St St S</p>
              <p className="text-yellow-800/70">Fargo, ND 58104</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-100">
            <h4 className="text-xl font-bold text-yellow-900 mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-yellow-200 rounded-2xl text-yellow-600 hover:bg-yellow-400 hover:text-yellow-900 transition-all">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://www.facebook.com/mabel.white.125" target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-yellow-200 rounded-2xl text-yellow-600 hover:bg-yellow-400 hover:text-yellow-900 transition-all">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-yellow-100 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                placeholder="Your name" 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                placeholder="Your email" 
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Message</label>
            <textarea 
              rows={5} 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
              placeholder="Your message..."
              required
            ></textarea>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-900 text-yellow-50 py-4 rounded-xl font-bold hover:bg-yellow-800 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Login = ({ user }: { user: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="bg-white p-10 rounded-[2.5rem] border border-yellow-100 shadow-xl">
        <h2 className="text-3xl font-serif italic text-yellow-900 mb-8 text-center">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-900 text-yellow-50 py-4 rounded-xl font-bold hover:bg-yellow-800 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-yellow-800/60 text-sm">
            Don't have an account? <Link to="/signup" className="text-yellow-600 font-bold hover:underline">Sign Up</Link>
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-yellow-50">
          <button 
            onClick={() => signInWithPopup(auth, facebookProvider)}
            className="w-full bg-white border border-yellow-200 text-yellow-900 py-3 rounded-xl font-bold hover:bg-yellow-50 transition-all flex items-center justify-center"
          >
            <Facebook className="w-5 h-5 mr-2 text-blue-600" />
            Continue with Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

const SignUp = ({ user }: { user: any }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      
      // Profile sync is handled in App.tsx useEffect
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="bg-white p-10 rounded-[2.5rem] border border-yellow-100 shadow-xl">
        <h2 className="text-3xl font-serif italic text-yellow-900 mb-8 text-center">Create Account</h2>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-yellow-900 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-900 text-yellow-50 py-4 rounded-xl font-bold hover:bg-yellow-800 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-yellow-800/60 text-sm">
            Already have an account? <Link to="/login" className="text-yellow-600 font-bold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const MeetMabel = () => {
  const testimonials = [
    {
      quote: "Mabel is a true artist. I've been coming to her for five years and my hair has never been healthier or more beautiful.",
      author: "Sarah J.",
      role: "Loyal Client"
    },
    {
      quote: "Her attention to detail is unmatched. The atmosphere in her studio is so warm and welcoming—it feels like home.",
      author: "Michael R.",
      role: "Regular Student"
    },
    {
      quote: "I came in with a complex request and Mabel handled it with ease. She's professional, talented, and incredibly kind.",
      author: "Aissatou B.",
      role: "Fashion Designer"
    }
  ];

  const skills = [
    { title: "20+ Years Experience", icon: <Clock className="w-5 h-5" /> },
    { title: "Specialized in Braids & Locs", icon: <Scissors className="w-5 h-5" /> },
    { title: "Deep Knowledge of African Hair Care", icon: <CheckCircle2 className="w-5 h-5" /> },
    { title: "Works with All Hair Types", icon: <User className="w-5 h-5" /> },
    { title: "Known for Neatness & Creativity", icon: <Plus className="w-5 h-5" /> }
  ];

  return (
    <div className="space-y-0 text-stone-800">
      {/* 1. Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-yellow-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?auto=format&fit=crop&q=80&w=1600" 
            alt="African braiding art" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/60 via-transparent to-yellow-900/90" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          >
            The Heart of the Art
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-serif italic text-yellow-50 mb-6 drop-shadow-lg"
          >
            Meet Mabel
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-yellow-100/90 font-light mb-10 tracking-wide"
          >
            20+ Years of African Braiding Excellence
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/book" className="bg-yellow-400 text-yellow-900 px-10 py-5 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-2xl flex items-center justify-center mx-auto w-fit text-lg">
              Book an Appointment <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. About Mabel */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative max-w-sm mx-auto lg:mx-0 lg:ml-auto lg:mr-12"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50" />
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src="https://storage.googleapis.com/cooper-dev-projects-2026/mabel-african-hairbraids-2026/mabel100-jpg.jpg" 
                  alt="Mabel" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 p-8 bg-yellow-900 text-yellow-50 rounded-3xl shadow-xl hidden md:block">
                <p className="text-3xl font-serif italic">Est. 2004</p>
                <p className="text-yellow-400 text-xs uppercase tracking-widest font-bold">Braiding in the US</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-serif italic text-yellow-900">A Journey of Passion and Tradition</h2>
              <div className="space-y-6 text-lg text-stone-600 leading-relaxed">
                <p>
                  Originally from Liberia, Mabel’s story is one of profound resilience and cultural pride. 
                  In 2004, she arrived in the United States as a refugee, carrying with her the rich 
                  traditions of her homeland and a set of skills that would eventually become her lifelong calling.
                </p>
                <p>
                  With over 20 years of professional experience, Mabel has mastered the intricate art of 
                  African hair braiding—a skill she first learned as a young girl, passed down through 
                  generations as a cornerstone of African culture. For Mabel, braiding is not just 
                  a job; it is a way to bridge heritage with modern style.
                </p>
                <p>
                  Her journey has been defined by hard work and a relentless passion for her craft. 
                  Today, she translates that dedication into every style she creates, focusing not 
                  just on the technique, but on how each client feels when they leave her seat. 
                  Mabel’s greatest joy comes from helping her clients discover their most confident, 
                  beautiful selves.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Experience & Expertise */}
      <section className="py-24 bg-stone-50 border-y border-yellow-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif italic text-yellow-900 mb-4 tracking-wide">Refined Expertise</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-yellow-100 shadow-sm hover:shadow-md transition-all flex items-center space-x-6 group"
              >
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 group-hover:bg-yellow-900 group-hover:text-yellow-50 transition-colors">
                  {skill.icon}
                </div>
                <h3 className="font-bold text-yellow-900">{skill.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Cultural Roots Section */}
      <section className="py-24 relative overflow-hidden bg-yellow-100/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-serif italic text-yellow-900 mb-8 underline decoration-yellow-400 decoration-offset-8">Our Cultural Roots</h2>
          <p className="text-xl text-yellow-800 leading-relaxed italic">
            "African braiding is not just a hairstyle; it is a profound cultural tradition that speaks of identity, 
            history, and community. I am honored to bring these authentic techniques and their stories from the 
            shores of Liberia to the heart of the United States, keeping our heritage alive through every braid."
          </p>
          <p className="mt-6 font-bold text-yellow-900 uppercase tracking-widest text-sm">— Mabel</p>
        </div>
      </section>

      {/* 4. Why Clients Love Mabel */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif italic text-yellow-900 mb-4">Why Clients Love Mabel</h2>
            <p className="text-yellow-800/60">Experience the difference of professional care and artistic vision.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {testimonials.map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-10 bg-stone-50 rounded-[3rem] border border-yellow-100"
              >
                <div className="text-yellow-300 absolute top-6 left-6 opacity-40">
                  <span className="text-8xl font-serif leading-none">“</span>
                </div>
                <p className="relative z-10 text-stone-600 mb-8 text-lg font-light italic leading-relaxed">
                  {t.quote}
                </p>
                <div className="border-t border-yellow-100 pt-6">
                  <p className="font-bold text-yellow-900">{t.author}</p>
                  <p className="text-xs text-yellow-600 uppercase tracking-widest mt-1">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call To Action */}
      <section className="py-32 bg-yellow-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #facc15 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-serif italic text-yellow-50 mb-8">Ready for your next look?</h2>
          <p className="text-xl text-yellow-200/70 mb-12 max-w-2xl mx-auto font-light tracking-wide">
            Step into our world of beauty and tradition. Let Mabel transform your hair with the elegance it deserves.
          </p>
          <Link to="/book" className="bg-yellow-400 text-yellow-900 px-12 py-6 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-2xl inline-flex items-center text-xl">
            Book Your Appointment Today <ChevronRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Sync profile to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const isAdmin = firebaseUser.email === 'mabelhairbraiding@yahoo.com' || firebaseUser.email === 'cooper.mover@gmail.com';
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            role: isAdmin ? 'admin' : 'client',
            createdAt: Timestamp.now()
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-stone-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-yellow-400 border-t-yellow-900 rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-stone-900 selection:bg-yellow-200 selection:text-yellow-900">
        <Toaster position="top-center" />
        <Navbar user={user} profile={profile} />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meet-mabel" element={<MeetMabel />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery isAdmin={profile?.role === 'admin'} />} />
            <Route path="/book" element={<Booking user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} profile={profile} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login user={user} />} />
            <Route path="/signup" element={<SignUp user={user} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
