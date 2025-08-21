
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from "@/contexts/ThemeContext"
import { Moon, Sun, Menu, X, MessageCircle, ShoppingCart, User } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  name: string;
  href: string;
  current: boolean;
  badge?: number;
}

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();
  const { profile, vendor } = useProfile();
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItemCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const navItems: NavItem[] = [
    { name: 'Home', href: '/', current: pathname === '/' },
    { name: 'Shop', href: '/shop', current: pathname === '/shop' },
  ];

  if (user) {
    if (profile?.role === 'admin') {
      navItems.push({ name: 'Admin', href: '/admin-panel', current: pathname === '/admin-panel' });
    } else if (vendor) {
      navItems.push({ name: 'Dashboard', href: '/vendor-dashboard', current: pathname === '/vendor-dashboard' });
    } else {
      navItems.push({ name: 'Dashboard', href: '/customer-dashboard', current: pathname === '/customer-dashboard' });
    }
  }

  return (
    <div className={`bg-background border-b transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className={`logo-circle ${scrolled ? 'scrolled' : ''}`}>
                KM
              </div>
              <span className={`logo-text ${scrolled ? 'scrolled' : ''}`}>
                Kantamanto
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  item.current 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                {/* Chat Icon */}
                <Link
                  to="/chat"
                  className={`relative px-3 py-2 rounded-md text-sm transition-colors ${
                    pathname === '/chat'
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>
                
                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className={`relative px-3 py-2 rounded-md text-sm transition-colors ${
                    pathname === '/cart'
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {!user ? (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={vendor?.profile_picture_url || undefined} alt={profile?.full_name || ''} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-full"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base transition-colors ${
                    item.current 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {user && (
                <>
                  {/* Mobile Chat */}
                  <Link
                    to="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base transition-colors ${
                      pathname === '/chat'
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      <span>Chat</span>
                    </div>
                  </Link>
                  
                  {/* Mobile Cart */}
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base transition-colors ${
                      pathname === '/cart'
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        <span>Cart</span>
                      </div>
                      {cartItemCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground rounded-full text-xs px-2 py-1">
                          {cartItemCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Auth */}
            <div className="pt-4 pb-3 border-t border-border">
              {!user ? (
                <div className="px-2 space-y-2">
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full"
                  >
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="px-2 space-y-1">
                  <div className="flex items-center px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={vendor?.profile_picture_url || undefined} alt={profile?.full_name || ''} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-sm">{profile?.full_name || 'User'}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                  >
                    Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-base text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navigation;
