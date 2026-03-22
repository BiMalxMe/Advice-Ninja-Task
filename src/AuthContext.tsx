import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'no user');
      try {
        if (firebaseUser) {
          let userData: User;
          
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                name: userDoc.data().name
              };
              console.log('User data from Firestore:', userData);
            } else {
              // Create user document if it doesn't exist
              const name = firebaseUser.displayName || firebaseUser.email!.split('@')[0];
              userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                name: name
              };
              console.log('Creating new user document:', userData);
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                name,
                email: firebaseUser.email,
                createdAt: new Date().toISOString()
              });
            }
          } catch (firestoreError) {
            console.error('Firestore error, using fallback:', firestoreError);
            // Fallback if Firestore fails
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || firebaseUser.email!.split('@')[0]
            };
          }
          
          console.log('Setting user state:', userData);
          setUser(userData);
        } else {
          console.log('No user, setting null');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        console.log('Auth loading complete');
        setLoading(false);
      }
    });

    // Fallback timeout in case Firebase doesn't respond
    const timeout = setTimeout(() => {
      console.log('Auth timeout, stopping loading');
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      createdAt: new Date().toISOString()
    });
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <img src="/CalendarX.png" alt="Calendar X" className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Calendar X</h2>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
