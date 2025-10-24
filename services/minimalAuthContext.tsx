import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface MinimalAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const MinimalAuthContext = createContext<MinimalAuthContextType | undefined>(undefined);

interface MinimalAuthProviderProps {
  children: ReactNode;
}

export const MinimalAuthProvider: React.FC<MinimalAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Listen to Firebase auth state changes with minimal error handling
  useEffect(() => {
    console.log('Minimal AuthProvider: Setting up Firebase auth state listener');
    
    if (!auth) {
      console.error('Minimal AuthProvider: Auth is not initialized');
      setError('Authentication not available');
      setIsLoading(false);
      return;
    }
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        try {
          console.log('Minimal AuthProvider: Firebase auth state changed, user:', firebaseUser ? firebaseUser.email : 'null');
          setUser(firebaseUser);
          setError(null); // Clear any previous errors
        } catch (error) {
          console.error('Minimal AuthProvider: Error in auth state change:', error);
          setError('Authentication error occurred');
        } finally {
          setIsLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Minimal AuthProvider: Error setting up auth listener:', error);
      setError('Failed to initialize authentication');
      setIsLoading(false);
    }
  }, [auth]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Minimal AuthProvider: Attempting login for:', email);
      
      if (!auth) {
        throw new Error('Authentication not available');
      }
      
      // Use direct Firebase auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Minimal AuthProvider: Login successful for:', userCredential.user.email);
    } catch (error: any) {
      console.error('Minimal login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Minimal AuthProvider: Logging out user');
      
      if (!auth) {
        throw new Error('Authentication not available');
      }
      
      await signOut(auth);
      console.log('Minimal AuthProvider: Logout successful');
    } catch (error: any) {
      console.error('Minimal logout error:', error);
      setError(error.message || 'Logout failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: MinimalAuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    error,
  };

  return (
    <MinimalAuthContext.Provider value={value}>
      {children}
    </MinimalAuthContext.Provider>
  );
};

export const useMinimalAuth = (): MinimalAuthContextType => {
  const context = useContext(MinimalAuthContext);
  if (context === undefined) {
    throw new Error('useMinimalAuth must be used within a MinimalAuthProvider');
  }
  return context;
};

