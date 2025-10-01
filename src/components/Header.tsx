import React, { useState } from 'react';
import { User, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <header className="bg-background border-b border-border px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 backdrop-blur-sm bg-background/95 shadow-sm transition-smooth">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-lg sm:text-2xl font-bold text-primary transition-smooth hover-scale">
            Medical Assessment
          </h1>
          <span className="hidden sm:inline-block text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded animate-fade-in">
            Clinical Platform
          </span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <User className="h-4 w-4" />
            <span className="max-w-[200px] truncate">{user?.email || 'User'}</span>
          </div>
          
          <Button variant="ghost" size="sm" className="hover-lift">
            <Settings className="h-4 w-4" />
            <span className="ml-2 hidden lg:inline">Settings</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover-lift">
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden lg:inline">Sign Out</span>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <div className="flex flex-col space-y-4 mt-8">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm truncate">{user?.email || 'User'}</span>
              </div>
              
              <Button 
                variant="ghost" 
                className="justify-start" 
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start text-destructive hover:text-destructive" 
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
